import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatPrice } from "@/lib/format";
import { currentMonthStr, monthBounds, resolveMonth } from "./month";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Vendor payouts" };

export default async function AdminVendorPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { month: monthParam } = await searchParams;
  const month = resolveMonth(monthParam);
  const { start, end } = monthBounds(month);

  const { data: redemptions } = await supabase
    .from("deal_redemptions")
    .select("id, deal_id, vendor_id, vendor_rate_cents, currency, redeemed_location, approved_at, reference_code")
    .not("approved_at", "is", null)
    .gte("approved_at", start)
    .lt("approved_at", end)
    .order("approved_at", { ascending: true });

  const dealIds = Array.from(new Set((redemptions ?? []).map((r) => r.deal_id)));
  const vendorIds = Array.from(new Set((redemptions ?? []).map((r) => r.vendor_id)));

  const [{ data: deals }, { data: vendors }] = await Promise.all([
    dealIds.length > 0
      ? supabase.from("deals").select("id, title").in("id", dealIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    vendorIds.length > 0
      ? supabase.from("vendors").select("id, name").in("id", vendorIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
  ]);

  const dealTitle = new Map((deals ?? []).map((d) => [d.id, d.title]));
  const vendorNameById = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  type Redemption = NonNullable<typeof redemptions>[number];

  const byVendor = new Map<string, Redemption[]>();
  for (const r of redemptions ?? []) {
    const list = byVendor.get(r.vendor_id) ?? [];
    list.push(r);
    byVendor.set(r.vendor_id, list);
  }

  const vendorRows = Array.from(byVendor.entries())
    .map(([vendorId, rows]) => {
      const byDeal = new Map<string, Redemption[]>();
      for (const r of rows) {
        const list = byDeal.get(r.deal_id) ?? [];
        list.push(r);
        byDeal.set(r.deal_id, list);
      }
      return {
        vendorId,
        vendorName: vendorNameById.get(vendorId) ?? "Vendor",
        currency: rows[0]?.currency ?? "sgd",
        owedCents: rows.reduce((sum, r) => sum + r.vendor_rate_cents, 0),
        count: rows.length,
        deals: Array.from(byDeal.entries())
          .map(([dealId, dealRows]) => ({
            dealId,
            title: dealTitle.get(dealId) ?? "Deal",
            count: dealRows.length,
            owedCents: dealRows.reduce((sum, r) => sum + r.vendor_rate_cents, 0),
          }))
          .sort((a, b) => b.owedCents - a.owedCents),
      };
    })
    .sort((a, b) => b.owedCents - a.owedCents);

  const totalOwedCents = vendorRows.reduce((sum, v) => sum + v.owedCents, 0);

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Vendor payouts</h2>
        <form method="get" style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
          <input type="month" name="month" defaultValue={month} className={styles.input} max={currentMonthStr()} />
          <button type="submit" className={styles.linkBtn}>
            Go
          </button>
        </form>
      </div>

      <p className={styles.hint} style={{ marginBottom: "var(--space-md)" }}>
        Counts only approved redemptions for {month} — the ones a vendor actually delivered on. A
        member who paid but never showed up costs nothing here.
      </p>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{formatPrice(totalOwedCents)}</div>
          <div className={styles.statLabel}>Total owed this month</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{(redemptions ?? []).length}</div>
          <div className={styles.statLabel}>Approved redemptions</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{vendorRows.length}</div>
          <div className={styles.statLabel}>Vendors to pay</div>
        </div>
      </div>

      <a href={`/admin/vendor-payouts/export?month=${month}`} className={styles.linkBtn}>
        Download CSV
      </a>

      {vendorRows.length === 0 ? (
        <p className={styles.empty}>No approved redemptions this month.</p>
      ) : (
        vendorRows.map((v) => (
          <div key={v.vendorId} style={{ marginTop: "var(--space-xl)" }}>
            <div className={styles.headerRow} style={{ marginBottom: "var(--space-sm)" }}>
              <h3>{v.vendorName}</h3>
              <strong>{formatPrice(v.owedCents, v.currency)}</strong>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Deal</th>
                    <th>Redemptions</th>
                    <th>Owed</th>
                  </tr>
                </thead>
                <tbody>
                  {v.deals.map((d) => (
                    <tr key={d.dealId}>
                      <td className={styles.rowTitle}>{d.title}</td>
                      <td className={styles.rowMeta}>{d.count}</td>
                      <td className={styles.rowMeta}>{formatPrice(d.owedCents, v.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
