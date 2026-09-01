import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import styles from "../studio.module.css";

export const metadata: Metadata = { title: "Deals" };

export default async function StudioDealsPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: subcategories }, { data: deals }, { data: vendors }] =
    await Promise.all([
      supabase
        .from("deal_categories")
        .select("id, name, display_order, is_hidden")
        .order("display_order"),
      supabase
        .from("deal_subcategories")
        .select("id, category_id, name, is_hidden")
        .order("display_order"),
      supabase
        .from("deals")
        .select(
          "id, title, cover_url, subcategory_id, vendor_id, locations, vendor_rate_cents, margin_percent, original_price_cents, currency, redemptions_per_cycle"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase.from("vendors").select("id, name"),
    ]);

  const visibleCategories = (categories ?? []).filter((c) => !c.is_hidden);
  const subcategoryById = new Map((subcategories ?? []).map((s) => [s.id, s]));
  const vendorName = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  const visibleDeals = (deals ?? []).filter((deal) => {
    const sub = subcategoryById.get(deal.subcategory_id);
    return sub && !sub.is_hidden;
  });

  const dealsByCategory = new Map<string, typeof visibleDeals>();
  for (const deal of visibleDeals) {
    const sub = subcategoryById.get(deal.subcategory_id)!;
    const list = dealsByCategory.get(sub.category_id) ?? [];
    list.push(deal);
    dealsByCategory.set(sub.category_id, list);
  }

  const categoriesWithDeals = visibleCategories.filter(
    (cat) => (dealsByCategory.get(cat.id) ?? []).length > 0
  );

  if (categoriesWithDeals.length === 0) {
    return (
      <EmptyState
        title="No deals yet"
        description="Vendor deals published from Supabase will appear here, grouped by category."
      />
    );
  }

  return (
    <div>
      {categoriesWithDeals.map((cat) => (
        <div key={cat.id} className={styles.dealsCategory}>
          <h2 className={styles.dealsCategoryTitle}>{cat.name}</h2>
          <div className={styles.dealsGrid}>
            {(dealsByCategory.get(cat.id) ?? []).map((deal) => {
              const memberPriceCents = Math.round(
                deal.vendor_rate_cents * (1 + deal.margin_percent / 100)
              );
              const sub = subcategoryById.get(deal.subcategory_id);

              return (
                <div key={deal.id} className={styles.posterCard}>
                  <span
                    className={styles.posterMedia}
                    style={deal.cover_url ? { backgroundImage: `url(${deal.cover_url})` } : undefined}
                    aria-hidden
                  />
                  <span className={styles.posterScrim} aria-hidden />
                  <div className={styles.posterBody}>
                    <p className={styles.dealSubcategory}>{sub?.name ?? cat.name}</p>
                    <p className={styles.posterName}>{deal.title}</p>
                    <p className={styles.posterTagline}>{vendorName.get(deal.vendor_id) ?? "Vendor"}</p>
                    <div className={styles.dealPriceRow}>
                      <span className={styles.posterName} style={{ fontSize: "1rem" }}>
                        {formatPrice(memberPriceCents, deal.currency)}
                      </span>
                      {deal.original_price_cents != null && (
                        <span className={styles.dealOriginalPrice}>
                          {formatPrice(deal.original_price_cents, deal.currency)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
