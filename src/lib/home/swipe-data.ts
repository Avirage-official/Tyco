import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ShopItem } from "@/components/home/FeaturedShop";
import type { DealPreview } from "@/components/home/SwipeDashboard";
import type { DashboardSlideImages, DashboardSlideVisibility, EventSlide } from "@/lib/supabase/types";

// The swipeable Retail/Happenings section piggybacks on the nav's own kill
// switch — hide Shop or Happenings from the nav and the matching swipe slide
// falls back to its "Coming soon" placeholder too, rather than tracking a
// second, easily-out-of-sync visibility toggle.
const SLIDE_TO_NAV_KEY = { retail: "shop", happenings: "happenings" } as const;

const SHOP_FIELDS = "id, name, price_cents, currency, images, category, published_at";

/**
 * Everything the swipeable Retail/Happenings section needs — shared because
 * the same swiper is embedded on the homepage and reused as the hero on
 * /shop and /studio.
 */
export async function getSwipeDashboardData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [shopItems, events, deals, { slideImages, hiddenSlides }] = await Promise.all([
    getFeaturedShop(supabase),
    getUpcomingEvents(supabase),
    getFeaturedDeals(supabase),
    getSlideSettings(supabase),
  ]);

  return { shopItems, events, deals, slideImages, hiddenSlides };
}

async function getFeaturedShop(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ShopItem[]> {
  const { data: featured } = await supabase
    .from("products")
    .select(SHOP_FIELDS)
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(4);

  if (featured && featured.length > 0) return featured;

  const { data: recent } = await supabase
    .from("products")
    .select(SHOP_FIELDS)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(4);

  return recent ?? [];
}

async function getUpcomingEvents(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<EventSlide[]> {
  const nowIso = new Date().toISOString();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, location, organizer, event_date, cover_url")
    .eq("is_published", true)
    .gte("event_date", nowIso)
    .order("event_date", { ascending: true })
    .limit(5);

  return events ?? [];
}

async function getFeaturedDeals(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<DealPreview[]> {
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, cover_url, vendor_id, vendor_rate_cents, margin_percent, currency")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(4);

  if (!deals || deals.length === 0) return [];

  const vendorIds = [...new Set(deals.map((d) => d.vendor_id))];
  const { data: vendors } = await supabase.from("vendors").select("id, name").in("id", vendorIds);
  const vendorName = new Map((vendors ?? []).map((v) => [v.id, v.name]));

  return deals.map((deal) => ({
    id: deal.id,
    title: deal.title,
    vendorName: vendorName.get(deal.vendor_id) ?? "Vendor",
    cover_url: deal.cover_url,
    member_price_cents: Math.round(deal.vendor_rate_cents * (1 + deal.margin_percent / 100)),
    currency: deal.currency,
  }));
}

async function getSlideSettings(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ slideImages: DashboardSlideImages; hiddenSlides: DashboardSlideVisibility }> {
  const { data } = await supabase
    .from("site_settings")
    .select("dashboard_slide_images, nav_hidden_items")
    .eq("id", true)
    .maybeSingle();

  const navHidden = data?.nav_hidden_items ?? {};
  const hiddenSlides: DashboardSlideVisibility = {};
  for (const [slideKey, navKey] of Object.entries(SLIDE_TO_NAV_KEY) as [
    keyof DashboardSlideVisibility,
    keyof typeof navHidden,
  ][]) {
    hiddenSlides[slideKey] = Boolean(navHidden[navKey]);
  }

  return { slideImages: data?.dashboard_slide_images ?? {}, hiddenSlides };
}
