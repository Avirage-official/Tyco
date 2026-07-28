import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getLikedTrackIds } from "@/lib/music/liked";
import { formatDate } from "@/lib/format";
import { TrackList } from "../../TrackList";
import { PlayTracksButton } from "../../PlayTracksButton";
import styles from "../../detail.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase.from("albums").select("title").eq("id", id).single();
  return { title: album?.title ?? "Album" };
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: album } = await supabase
    .from("albums")
    .select("id, title, artist_id, cover_url, release_date")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!album) notFound();

  const [{ data: artist }, { data: tracks }, likedTrackIds] = await Promise.all([
    album.artist_id
      ? supabase.from("artists").select("id, name").eq("id", album.artist_id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("tracks")
      .select("id, title, artist_id, album_id, cover_url, audio_url, duration_seconds, published_at")
      .eq("album_id", id)
      .eq("is_published", true)
      .order("track_number", { ascending: true }),
    getLikedTrackIds(supabase),
  ]);

  const tracksWithArtist = (tracks ?? []).map((track) => ({
    ...track,
    artist: artist?.name ?? "Tyco",
  }));

  return (
    <div className="container">
      <div className={styles.hero}>
        <div
          className={styles.heroCover}
          style={album.cover_url ? { backgroundImage: `url(${album.cover_url})` } : undefined}
        />
        <div className={styles.heroMeta}>
          <p className="eyebrow">Album</p>
          <h1 className={styles.heroTitle}>{album.title}</h1>
          <p className={styles.heroSub}>
            {artist && <Link href={`/music/artists/${artist.id}`}>{artist.name}</Link>}
            {artist && album.release_date && " · "}
            {album.release_date && formatDate(album.release_date)}
          </p>
          <div className={styles.heroActions}>
            <PlayTracksButton tracks={tracksWithArtist} label="Play album" />
          </div>
        </div>
      </div>

      {tracksWithArtist.length > 0 ? (
        <TrackList tracks={tracksWithArtist} likedTrackIds={likedTrackIds} />
      ) : (
        <EmptyState title="No tracks yet" description="Tracks added to this album will show up here." />
      )}
    </div>
  );
}
