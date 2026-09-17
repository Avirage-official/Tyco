import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Everything a deal card or detail page needs, joined and priced. */
export type DealSummary = {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  locations: string[];
  currency: string;
  memberPriceCents: number;
  originalPriceCents: number | null;
  /** Redemptions still available this calendar month. */
  capRemaining: number;
  vendorId: string;
  vendorName: string;
  categoryId: string;
  categoryName: string;
  subcategoryName: string;
  publishedAt: string | null;
};

export type DealCategory = { id: string; name: string };

export type DealCatalog = {
  deals: DealSummary[];
  /** Visible categories that have at least one visible deal, in display order. */
  categories: DealCategory[];
};

/** The price a member pays: the vendor's rate plus Tyco's margin. */
export function memberPriceCents(vendorRateCents: number, marginPercent: number) {
  return Math.round(vendorRateCents * (1 + marginPercent / 100));
}

/**
 * First of the current calendar month, UTC — matches the server-side
 * date_trunc('month', now())::date used by get_or_create_deal_cycle. Only
 * used to show remaining redemptions; the real cap check happens again,
 * authoritatively, inside startDealCheckout at purchase time.
 */
export function currentCycleStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

/**
 * Loads every published deal whose category and subcategory are visible,
 * with vendor and category names and this month's remaining cap attached.
 * One call serves the list page, the detail page (find by id, siblings by
 * vendor) and the homepage row.
 */
export async function getDealCatalog(supabase: Supabase): Promise<DealCatalog> {
  const [{ data: categories }, { data: subcategories }, { data: deals }, { data: vendors }, { data: cycles }] =
    await Promise.all([
      supabase.from("deal_categories").select("id, name, display_order, is_hidden").order("display_order"),
      supabase.from("deal_subcategories").select("id, category_id, name, is_hidden").order("display_order"),
      supabase
        .from("deals")
        .select(
          "id, title, description, cover_url, subcategory_id, vendor_id, locations, vendor_rate_cents, margin_percent, original_price_cents, currency, redemptions_per_cycle, published_at"
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      supabase.from("vendors").select("id, name"),
      supabase
        .from("deal_cycles")
        .select("deal_id, redemptions_cap, redemptions_used")
        .eq("cycle_start", currentCycleStart()),
    ]);

  const categoryById = new Map((categories ?? []).filter((c) => !c.is_hidden).map((c) => [c.id, c]));
  const subcategoryById = new Map((subcategories ?? []).filter((s) => !s.is_hidden).map((s) => [s.id, s]));
  const vendorById = new Map((vendors ?? []).map((v) => [v.id, v.name]));
  const cycleByDealId = new Map((cycles ?? []).map((c) => [c.deal_id, c]));

  const summaries: DealSummary[] = [];
  for (const deal of deals ?? []) {
    const sub = subcategoryById.get(deal.subcategory_id);
    const category = sub ? categoryById.get(sub.category_id) : undefined;
    if (!sub || !category) continue;

    const cycle = cycleByDealId.get(deal.id);
    const cap = cycle?.redemptions_cap ?? deal.redemptions_per_cycle;
    const used = cycle?.redemptions_used ?? 0;

    summaries.push({
      id: deal.id,
      title: deal.title,
      description: deal.description,
      coverUrl: deal.cover_url,
      locations: deal.locations ?? [],
      currency: deal.currency,
      memberPriceCents: memberPriceCents(deal.vendor_rate_cents, deal.margin_percent),
      originalPriceCents: deal.original_price_cents,
      capRemaining: Math.max(0, cap - used),
      vendorId: deal.vendor_id,
      vendorName: vendorById.get(deal.vendor_id) ?? "Vendor",
      categoryId: category.id,
      categoryName: category.name,
      subcategoryName: sub.name,
      publishedAt: deal.published_at,
    });
  }

  const usedCategoryIds = new Set(summaries.map((d) => d.categoryId));
  const visibleCategories = Array.from(categoryById.values())
    .filter((c) => usedCategoryIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  return { deals: summaries, categories: visibleCategories };
}
