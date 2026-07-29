import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { getLikedTrackIds } from "@/lib/music/liked";
import { TrackList } from "../../TrackList";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ genre: string }>;
}): Promise<Metadata> {
  const { genre } = await params;
  return { title: decodeURIComponent(genre) };
}

export default async function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre } = await params;
  const genreName = decodeURIComponent(genre);
  const supabase = await createClient();

  const [{ data: tracks }, { data: artists }, likedTrackIds] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, title, artist_id, cover_url, audio_url, duration_seconds, published_at")
      .eq("is_published", true)
      .ilike("genre", genreName)
      .order("release_date", { ascending: false }),
    supabase.from("artists").select("id, name"),
    getLikedTrackIds(supabase),
  ]);

  if (!tracks || tracks.length === 0) notFound();

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));
  const tracksWithArtist = tracks.map((track) => ({
    ...track,
    artist: (track.artist_id && artistNameById.get(track.artist_id)) || "Tyco",
  }));

  return (
    <>
      <PageHeader eyebrow="Genre" title={genreName} />
      <div className="container">
        <TrackList tracks={tracksWithArtist} likedTrackIds={likedTrackIds} />
      </div>
    </>
  );
}
