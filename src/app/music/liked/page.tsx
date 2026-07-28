import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { TrackList } from "../TrackList";

export const metadata: Metadata = { title: "Liked Songs" };

export default async function LikedSongsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/music/liked");
  }

  const { data: likes } = await supabase
    .from("track_likes")
    .select("track_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orderedIds = (likes ?? []).map((l) => l.track_id);

  const [{ data: tracks }, { data: artists }] = await Promise.all([
    orderedIds.length > 0
      ? supabase
          .from("tracks")
          .select("id, title, artist_id, cover_url, audio_url, duration_seconds, published_at")
          .in("id", orderedIds)
          .eq("is_published", true)
      : Promise.resolve({ data: [] }),
    supabase.from("artists").select("id, name"),
  ]);

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));
  const positionById = new Map(orderedIds.map((id, i) => [id, i]));
  const tracksWithArtist = (tracks ?? [])
    .map((track) => ({
      ...track,
      artist: (track.artist_id && artistNameById.get(track.artist_id)) || "Tyco",
    }))
    .sort((a, b) => (positionById.get(a.id) ?? 0) - (positionById.get(b.id) ?? 0));

  return (
    <>
      <PageHeader eyebrow="Your collection" title="Liked Songs" />
      <div className="container">
        {tracksWithArtist.length > 0 ? (
          <TrackList tracks={tracksWithArtist} likedTrackIds={orderedIds} />
        ) : (
          <EmptyState
            title="Nothing liked yet"
            description="Tap the heart on any track to save it here."
          />
        )}
      </div>
    </>
  );
}
