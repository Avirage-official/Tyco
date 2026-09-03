import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { DealRedeem } from "./DealRedeem";
import { DealsCategoryFilter } from "./DealsCategoryFilter";
import styles from "../studio.module.css";

export const metadata: Metadata = { title: "Deals" };

// First of the current calendar month, UTC — matches the server-side
// date_trunc('month', now())::date used by get_or_create_deal_cycle. Only
// used here to show remaining redemptions; the real cap check happens
// again, authoritatively, inside startDealCheckout at purchase time.
function currentCycleStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

export default async function StudioDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: selectedCategoryId } = await searchParams;
  const supabase = await createClient();

  const [
    { data: categories },
    { data: subcategories },
    { data: deals },
    { data: vendors },
    { data: cycles },
    { data: userData },
  ] = await Promise.all([
    supabase.from("deal_categories").select("id, name, display_order, is_hidden").order("display_order"),
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
    supabase
      .from("deal_cycles")
      .select("deal_id, redemptions_cap, redemptions_used")
      .eq("cycle_start", currentCycleStart()),
    supabase.auth.getUser(),
  ]);

  const visibleCategories = (categories ?? []).filter((c) => !c.is_hidden);
  const subcategoryById = new Map((subcategories ?? []).map((s) => [s.id, s]));
  const vendorName = new Map((vendors ?? []).map((v) => [v.id, v.name]));
  const cycleByDealId = new Map((cycles ?? []).map((c) => [c.deal_id, c]));
  const signedIn = Boolean(userData.user);

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

  const shownCategories = selectedCategoryId
    ? categoriesWithDeals.filter((cat) => cat.id === selectedCategoryId)
    : categoriesWithDeals;

  return (
    <div>
      <DealsCategoryFilter categories={categoriesWithDeals} activeId={selectedCategoryId ?? null} />
      {shownCategories.length === 0 && (
        <p className={styles.hint}>No deals in this category right now.</p>
      )}
      {shownCategories.map((cat) => (
        <div key={cat.id} className={styles.dealsCategory}>
          <h2 className={styles.dealsCategoryTitle}>{cat.name}</h2>
          <div className={styles.dealsGrid}>
            {(dealsByCategory.get(cat.id) ?? []).map((deal) => {
              const memberPriceCents = Math.round(
                deal.vendor_rate_cents * (1 + deal.margin_percent / 100)
              );
              const sub = subcategoryById.get(deal.subcategory_id);
              const cycle = cycleByDealId.get(deal.id);
              const capRemaining =
                (cycle?.redemptions_cap ?? deal.redemptions_per_cycle) - (cycle?.redemptions_used ?? 0);

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
                    <div className={styles.dealAction}>
                      <DealRedeem
                        dealId={deal.id}
                        memberPriceCents={memberPriceCents}
                        currency={deal.currency}
                        capRemaining={capRemaining}
                        signedIn={signedIn}
                      />
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
