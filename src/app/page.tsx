import { Marketing } from "@/components/home/Marketing";
import { Dashboard, type DashboardProps } from "@/components/home/Dashboard";
import type { ReleasePreview } from "@/components/home/JournalStrip";
import { getSwipeDashboardData } from "@/lib/home/swipe-data";
import { getDealCatalog } from "@/lib/deals/catalog";
import { getEventCatalog } from "@/lib/events/catalog";
import { createClient } from "@/lib/supabase/server";

const RELEASE_STRIP_LIMIT = 10;

/** Deals and events shown on the homepage before "See all" takes over. */
const ROW_LIMIT = 4;

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
    const name = profile?.display_name ?? "there";

    const dashboardData = await getDashboardData(supabase, name);
    return <Dashboard {...dashboardData} />;
  }

  const [{ deals }, { upcoming }, { data: settings }, releases] = await Promise.all([
    getDealCatalog(supabase),
    getEventCatalog(supabase),
    supabase.from("site_settings").select("about_gallery").eq("id", true).maybeSingle(),
    getFeaturedReleases(supabase),
  ]);

  return (
    <Marketing
      deals={deals.slice(0, ROW_LIMIT)}
      events={upcoming.slice(0, ROW_LIMIT)}
      slides={settings?.about_gallery ?? []}
      releases={releases}
    />
  );
}
