import { Marketing } from "@/components/home/Marketing";
import { Dashboard, type DashboardProps } from "@/components/home/Dashboard";
import type { SpotlightProps } from "@/components/home/Spotlight";
import { createClient } from "@/lib/supabase/server";

async function getSpotlight(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<{ release: SpotlightProps | null; event: SpotlightProps | null }> {
  const nowIso = new Date().toISOString();

  const [{ data: event }, { data: album }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, location, event_date")
      .eq("is_published", true)
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("albums")
      .select("id, title, artist_id, cover_url, release_date")
      .eq("is_published", true)
      .order("release_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let eventSpotlight: SpotlightProps | null = null;
  if (event) {
    eventSpotlight = {
      kind: "event",
      href: "/studio/events",
      title: event.title,
      location: event.location,
      date: event.event_date,
    };
  }

  let releaseSpotlight: SpotlightProps | null = null;
  if (album) {
    let artistName = "Tyco";
    if (album.artist_id) {
      const { data: artist } = await supabase
        .from("artists")
        .select("name")
        .eq("id", album.artist_id)
        .maybeSingle();
      if (artist?.name) artistName = artist.name;
    }
    releaseSpotlight = {
      kind: "release",
      href: `/music/albums/${album.id}`,
      title: album.title,
      artist: artistName,
      coverUrl: album.cover_url,
      date: album.release_date ?? new Date().toISOString(),
    };
  }

  return { release: releaseSpotlight, event: eventSpotlight };
}

async function getDashboardData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  name: string
): Promise<DashboardProps> {
  const [{ release, event }, { data: settings }, { count: likedCount }, { count: playlistCount }, { count: orderCount }, { count: followedCount }] =
    await Promise.all([
      getSpotlight(supabase),
      supabase
        .from("site_settings")
        .select("next_project_title, next_project_body, next_project_image_url, mission_raised_cents, mission_goal_cents")
        .eq("id", true)
        .maybeSingle(),
      supabase.from("track_likes").select("track_id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("playlists").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("artist_follows").select("artist_id", { count: "exact", head: true }).eq("user_id", userId),
    ]);

  const nextProject = settings?.next_project_title
    ? {
        title: settings.next_project_title,
        body: settings.next_project_body,
        imageUrl: settings.next_project_image_url,
      }
    : null;

  const mission = settings
    ? { raisedCents: settings.mission_raised_cents, goalCents: settings.mission_goal_cents }
    : null;

  return {
    name,
    release,
    event,
    nextProject,
    mission,
    likedCount: likedCount ?? 0,
    playlistCount: playlistCount ?? 0,
    orderCount: orderCount ?? 0,
    followedCount: followedCount ?? 0,
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

  const { release, event } = await getSpotlight(supabase);
  return <Marketing spotlight={event ?? release} />;
}
