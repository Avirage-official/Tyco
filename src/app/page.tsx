import { Marketing } from "@/components/home/Marketing";
import { Dashboard, type DashboardProps } from "@/components/home/Dashboard";
import type { SpotlightProps } from "@/components/home/Spotlight";
import type { ReleasePreview } from "@/components/home/JournalStrip";
import { getSwipeDashboardData } from "@/lib/home/swipe-data";
import { createClient } from "@/lib/supabase/server";

const RELEASE_STRIP_LIMIT = 10;

async function getFeaturedReleases(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<ReleasePreview[]> {
  const { data } = await supabase
    .from("feed_items")
    .select("id, title, cover_url, source_channel, release_date, published_at")
    .eq("type", "release")
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(RELEASE_STRIP_LIMIT);

  return data ?? [];
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

async function getDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  name: string
): Promise<DashboardProps> {
  const [swipeData, releases] = await Promise.all([
    getSwipeDashboardData(supabase),
    getFeaturedReleases(supabase),
  ]);
  return { name, releases, ...swipeData };
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

    const dashboardData = await getDashboardData(supabase, name);
    return <Dashboard {...dashboardData} />;
  }

  const [event, { data: settings }, releases] = await Promise.all([
    getSpotlight(supabase),
    supabase.from("site_settings").select("about_gallery").eq("id", true).maybeSingle(),
    getFeaturedReleases(supabase),
  ]);

  return <Marketing spotlight={event} slides={settings?.about_gallery ?? []} releases={releases} />;
}
