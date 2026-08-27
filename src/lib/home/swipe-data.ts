import "server-only";
import type { createClient } from "@/lib/supabase/server";
import type { ShopItem } from "@/components/home/FeaturedShop";
import type { CreatorPreview } from "@/components/home/SwipeDashboard";
import type { DashboardSlideImages, EventSlide } from "@/lib/supabase/types";

const SHOP_FIELDS = "id, name, price_cents, currency, images, category, published_at";

/**
 * Everything the swipeable Retail/Happenings/Creators/Services section
 * needs — shared because the same swiper is embedded on the homepage and
 * reused as the hero on /shop, /studio, and /creators.
 */
export async function getSwipeDashboardData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [shopItems, events, creators, slideImages] = await Promise.all([
    getFeaturedShop(supabase),
    getUpcomingEvents(supabase),
    getFeaturedCreators(supabase),
    getSlideImages(supabase),
  ]);

  return { shopItems, events, creators, slideImages };
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

async function getFeaturedCreators(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<CreatorPreview[]> {
  const { data: creators } = await supabase
    .from("creators")
    .select("slug, name, type, tagline, avatar_url, banner_url")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(3);

  return creators ?? [];
}

async function getSlideImages(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<DashboardSlideImages> {
  const { data } = await supabase
    .from("site_settings")
    .select("dashboard_slide_images")
    .eq("id", true)
    .maybeSingle();

  return data?.dashboard_slide_images ?? {};
}
