import { Marketing } from "@/components/home/Marketing";
import { Dashboard, type DashboardProps } from "@/components/home/Dashboard";
import type { SpotlightProps } from "@/components/home/Spotlight";
import type { ShopItem } from "@/components/home/FeaturedShop";
import type { EventSlide } from "@/components/home/MissionEventSplit";
import { createClient } from "@/lib/supabase/server";

const SHOP_FIELDS = "id, name, price_cents, currency, images, category, published_at";

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

async function getSpotlight(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<SpotlightProps | null> {
  const nowIso = new Date().toISOString();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, location, organizer, event_date, cover_url")
    .eq("is_published", true)
    .gte("event_date", nowIso)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!event) return null;

  return {
    kind: "event",
    href: "/studio",
    title: event.title,
    location: event.location,
    organizer: event.organizer,
    date: event.event_date,
    coverUrl: event.cover_url,
  };
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

async function getAmbientImages(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: portfolio } = await supabase
    .from("portfolio_items")
    .select("cover_url")
    .eq("is_published", true)
    .not("cover_url", "is", null)
    .order("published_at", { ascending: false })
    .limit(4);

  const urls = (portfolio ?? [])
    .map((row) => row.cover_url)
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls)).slice(0, 4);
}

async function getDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string
): Promise<DashboardProps> {
  const [events, { data: settings }, ambientImages, { count: orderCount }, shopItems] = await Promise.all([
    getUpcomingEvents(supabase),
    supabase
      .from("site_settings")
      .select(
        "next_project_title, next_project_body, next_project_image_url, mission_blurb, mission_raised_cents, mission_goal_cents, about_gallery"
      )
      .eq("id", true)
      .maybeSingle(),
    getAmbientImages(supabase),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
    getFeaturedShop(supabase),
  ]);

  const nextProject = settings?.next_project_title
    ? {
        title: settings.next_project_title,
        body: settings.next_project_body,
        imageUrl: settings.next_project_image_url,
      }
    : null;

  return {
    name,
    events,
    nextProject,
    missionBlurb: settings?.mission_blurb ?? null,
    missionRaisedCents: settings?.mission_raised_cents ?? 0,
    missionGoalCents: settings?.mission_goal_cents ?? 0,
    ambientImages,
    slides: settings?.about_gallery ?? [],
    orderCount: orderCount ?? 0,
    shopItems,
  };
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    const name = profile?.display_name ?? user.email?.split("@")[0] ?? "there";

    const dashboardData = await getDashboardData(supabase, user.id, name);
    return <Dashboard {...dashboardData} />;
  }

  const [event, { data: settings }] = await Promise.all([
    getSpotlight(supabase),
    supabase.from("site_settings").select("about_gallery").eq("id", true).maybeSingle(),
  ]);

  return <Marketing spotlight={event} slides={settings?.about_gallery ?? []} />;
}
