import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { TrackList } from "./TrackList";

export const metadata: Metadata = { title: "Music" };

export default async function MusicPage() {
  const supabase = await createClient();
  const [{ data: tracks }, { data: artists }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, title, artist_id, cover_url, audio_url, duration_seconds, published_at")
      .eq("is_published", true)
      .order("release_date", { ascending: false }),
    supabase.from("artists").select("id, name"),
  ]);

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));
  const tracksWithArtist = (tracks ?? []).map((track) => ({
    ...track,
    artist: (track.artist_id && artistNameById.get(track.artist_id)) || "Tyco",
  }));

  return (
    <>
      <PageHeader
        eyebrow="Free, always"
        title="Music"
        description="Every track we've put out, free to stream — no account, no paywall."
      />
      <div className="container">
        {tracksWithArtist.length > 0 ? (
          <TrackList tracks={tracksWithArtist} />
        ) : (
          <EmptyState
            title="The catalogue is warming up"
            description="Tracks published in Supabase will show up here automatically, ready to stream."
          />
        )}
      </div>
    </>
  );
}
