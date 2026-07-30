import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getLikedTrackIds } from "@/lib/music/liked";
import { MusicTabs } from "./MusicTabs";
import { MusicBrowse } from "./MusicBrowse";

export const metadata: Metadata = { title: "Music" };

export default async function MusicPage() {
  const supabase = await createClient();
  const [{ data: tracks }, { data: albums }, { data: artists }, likedTrackIds] = await Promise.all([
    supabase
      .from("tracks")
      .select(
        "id, title, artist_id, album_id, cover_url, audio_url, duration_seconds, published_at, genre"
      )
      .eq("is_published", true)
      .order("release_date", { ascending: false }),
    supabase
      .from("albums")
      .select("id, title, artist_id, cover_url, release_date")
      .eq("is_published", true)
      .order("release_date", { ascending: false }),
    supabase.from("artists").select("id, name, photo_url").eq("is_published", true).order("name"),
    getLikedTrackIds(supabase),
  ]);

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));
  const tracksWithArtist = (tracks ?? []).map((track) => ({
    ...track,
    artist: (track.artist_id && artistNameById.get(track.artist_id)) || "Tyco",
  }));

  const genres = Array.from(new Set((tracks ?? []).map((t) => t.genre).filter(Boolean))) as string[];
  genres.sort((a, b) => a.localeCompare(b));

  const isEmpty = tracksWithArtist.length === 0 && (albums ?? []).length === 0 && (artists ?? []).length === 0;

  return (
    <>
      <PageHeader
        eyebrow="Free, always"
        title="Music"
        description="Every track we've put out, free to stream — no account, no paywall."
      />
      <div className="container">
        <MusicTabs />
        {isEmpty ? (
          <EmptyState
            title="The catalogue is warming up"
            description="Tracks published in Supabase will show up here automatically, ready to stream."
          />
        ) : (
          <MusicBrowse
            tracks={tracksWithArtist}
            albums={albums ?? []}
            artists={artists ?? []}
            genres={genres}
            likedTrackIds={likedTrackIds}
            artistNameById={artistNameById}
          />
        )}
      </div>
    </>
  );
}
