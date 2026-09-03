import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { RedemptionRowAction } from "./RedemptionRowAction";
import styles from "../admin.module.css";

export const metadata: Metadata = { title: "Redemptions" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function AdminDealRedemptionsPage() {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();

  await supabase.rpc("expire_stale_deal_redemptions");

  const [{ data: redemptions }, { data: deals }, { data: vendors }, { data: userList }] = await Promise.all([
    supabase
      .from("deal_redemptions")
      .select(
        "id, deal_id, vendor_id, user_id, total_cents, currency, status, reference_code, approved_at, redeemed_location, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("deals").select("id, title, locations"),
    supabase.from("vendors").select("id, name"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const dealById = new Map((deals ?? []).map((d) => [d.id, d]));
  const vendorName = new Map((vendors ?? []).map((v) => [v.id, v.name]));
  const emailByUserId = new Map((userList?.users ?? []).map((u) => [u.id, u.email]));

  const paidRedemptions = (redemptions ?? []).filter((r) => r.status === "paid");
  const revenueCents = paidRedemptions.reduce((sum, r) => sum + r.total_cents, 0);
  const approvedCount = paidRedemptions.filter((r) => r.approved_at).length;
  const pendingCount = (redemptions ?? []).filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Redemptions</h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{formatPrice(revenueCents)}</div>
          <div className={styles.statLabel}>Redemption revenue (paid)</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{approvedCount}</div>
          <div className={styles.statLabel}>Approved (used)</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{pendingCount}</div>
          <div className={styles.statLabel}>Pending payment</div>
        </div>
      </div>

      {!redemptions || redemptions.length === 0 ? (
        <p className={styles.empty}>No redemptions yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Deal</th>
                <th>Vendor</th>
                <th>Buyer</th>
                <th>Total</th>
                <th>Purchased</th>
                <th>Status</th>
                <th>Approved</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((redemption) => {
                const deal = dealById.get(redemption.deal_id);
                return (
                  <tr key={redemption.id}>
                    <td className={styles.rowTitle}>{redemption.reference_code}</td>
                    <td className={styles.rowMeta}>{deal?.title ?? "—"}</td>
                    <td className={styles.rowMeta}>{vendorName.get(redemption.vendor_id) ?? "—"}</td>
                    <td className={styles.rowMeta}>{emailByUserId.get(redemption.user_id) ?? "—"}</td>
                    <td className={styles.rowMeta}>{formatPrice(redemption.total_cents, redemption.currency)}</td>
                    <td className={styles.rowMeta}>{formatDate(redemption.created_at)}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          redemption.status === "paid" ? styles.badgePublished : styles.badgeDraft
                        }`}
                      >
                        {STATUS_LABEL[redemption.status] ?? redemption.status}
                      </span>
                    </td>
                    <td className={styles.rowMeta}>
                      {redemption.approved_at
                        ? `${formatDate(redemption.approved_at)}${
                            redemption.redeemed_location ? ` — ${redemption.redeemed_location}` : ""
                          }`
                        : "—"}
                    </td>
                    <td>
                      {redemption.status === "paid" && !redemption.approved_at && (
                        <RedemptionRowAction redemptionId={redemption.id} locations={deal?.locations ?? []} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
