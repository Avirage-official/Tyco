import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatPrice } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import {
  toggleDealPublish,
  deleteDeal,
  toggleDealCategoryHidden,
  toggleDealSubcategoryHidden,
} from "./actions";
import styles from "../admin.module.css";

export default async function AdminDealsPage() {
  const { supabase } = await requireAdmin();

  const [
    { data: categories },
    { data: subcategories },
    { data: deals },
    { data: vendors },
  ] = await Promise.all([
    supabase.from("deal_categories").select("id, name, is_hidden").order("display_order"),
    supabase
      .from("deal_subcategories")
      .select("id, category_id, name, is_hidden")
      .order("display_order"),
    supabase
      .from("deals")
      .select(
        "id, vendor_id, subcategory_id, title, cover_url, vendor_rate_cents, margin_percent, redemptions_per_cycle, is_published"
      )
      .order("created_at", { ascending: false }),
    supabase.from("vendors").select("id, name"),
  ]);

  const vendorName = new Map((vendors ?? []).map((v) => [v.id, v.name]));
  const subcategoryName = new Map((subcategories ?? []).map((s) => [s.id, s.name]));
  const subcategoriesByCategory = new Map<string, typeof subcategories>();
  for (const sub of subcategories ?? []) {
    const list = subcategoriesByCategory.get(sub.category_id) ?? [];
    list.push(sub);
    subcategoriesByCategory.set(sub.category_id, list);
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Deal categories</h2>
      </div>
      <p className={styles.hint} style={{ marginBottom: "var(--space-md)" }}>
        Hide a category or subcategory to pull it from the deals network without deleting its
        deals — useful mid-incident or between iterations.
      </p>

      {(categories ?? []).map((cat) => (
        <div key={cat.id} style={{ marginBottom: "var(--space-md)" }}>
          <div className={styles.checkboxRow}>
            <form action={toggleDealCategoryHidden.bind(null, cat.id, !cat.is_hidden)}>
              <button type="submit" className={styles.linkBtn}>
                {cat.is_hidden ? "Unhide" : "Hide"}
              </button>
            </form>
            <strong>{cat.name}</strong>
            {cat.is_hidden && (
              <span className={`${styles.badge} ${styles.badgeDraft}`}>Hidden</span>
            )}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-xs)", marginTop: "var(--space-2xs)", paddingLeft: "var(--space-lg)" }}>
            {(subcategoriesByCategory.get(cat.id) ?? []).map((sub) => (
              <form key={sub.id} action={toggleDealSubcategoryHidden.bind(null, sub.id, !sub.is_hidden)}>
                <button
                  type="submit"
                  className={styles.linkBtn}
                  style={sub.is_hidden ? { opacity: 0.5 } : undefined}
                >
                  {sub.is_hidden ? `${sub.name} (hidden)` : sub.name}
                </button>
              </form>
            ))}
          </div>
        </div>
      ))}

      <div className={styles.headerRow} style={{ marginTop: "var(--space-xl)" }}>
        <h2>Deals</h2>
        <Link href="/admin/deals/new" className={styles.linkBtn}>
          + New deal
        </Link>
      </div>

      {!deals || deals.length === 0 ? (
        <p className={styles.empty}>No deals yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Member price</th>
                <th>Cap / month</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const memberPriceCents = Math.round(
                  deal.vendor_rate_cents * (1 + deal.margin_percent / 100)
                );
                return (
                  <tr key={deal.id}>
                    <td>
                      <div
                        className={styles.rowThumb}
                        style={deal.cover_url ? { backgroundImage: `url(${deal.cover_url})` } : undefined}
                      />
                    </td>
                    <td className={styles.rowTitle}>{deal.title}</td>
                    <td className={styles.rowMeta}>{vendorName.get(deal.vendor_id) ?? "—"}</td>
                    <td className={styles.rowMeta}>{subcategoryName.get(deal.subcategory_id) ?? "—"}</td>
                    <td className={styles.rowMeta}>{formatPrice(memberPriceCents, "sgd")}</td>
                    <td className={styles.rowMeta}>{deal.redemptions_per_cycle}</td>
                    <td>
                      <PublishBadge isPublished={deal.is_published} />
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link href={`/admin/deals/${deal.id}`} className={styles.linkBtn}>
                          Edit
                        </Link>
                        <form action={toggleDealPublish.bind(null, deal.id, !deal.is_published)}>
                          <button type="submit" className={styles.linkBtn}>
                            {deal.is_published ? "Unpublish" : "Publish"}
                          </button>
                        </form>
                        <form action={deleteDeal.bind(null, deal.id)}>
                          <button type="submit" className={styles.dangerBtn}>
                            Delete
                          </button>
                        </form>
                      </div>
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
