import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getLikedTrackIds } from "@/lib/music/liked";
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
  const { data: artist } = await supabase.from("artists").select("name").eq("id", id).single();
  return { title: artist?.name ?? "Artist" };
}

export default async function ArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, bio, photo_url")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!artist) notFound();

  const [{ data: albums }, { data: tracks }, likedTrackIds] = await Promise.all([
    supabase
      .from("albums")
      .select("id, title, cover_url, release_date")
      .eq("artist_id", id)
      .eq("is_published", true)
      .order("release_date", { ascending: false }),
    supabase
      .from("tracks")
      .select("id, title, album_id, cover_url, audio_url, duration_seconds, published_at")
      .eq("artist_id", id)
      .eq("is_published", true)
      .order("release_date", { ascending: false }),
    getLikedTrackIds(supabase),
  ]);

  const allTracks = (tracks ?? []).map((track) => ({ ...track, artist: artist.name, artist_id: artist.id }));
  const singles = allTracks.filter((track) => !track.album_id);

  return (
    <div className="container">
      <div className={styles.hero}>
        <div
          className={`${styles.heroCover} ${styles.heroCoverRound}`}
          style={artist.photo_url ? { backgroundImage: `url(${artist.photo_url})` } : undefined}
        />
        <div className={styles.heroMeta}>
          <p className="eyebrow">Artist</p>
          <h1 className={styles.heroTitle}>{artist.name}</h1>
          <div className={styles.heroActions}>
            <PlayTracksButton tracks={allTracks} label="Play" />
          </div>
        </div>
      </div>

      {artist.bio && <p className={styles.bio}>{artist.bio}</p>}

      {albums && albums.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Albums</h2>
          <div className={styles.albumGrid}>
            {albums.map((album) => (
              <Link key={album.id} href={`/music/albums/${album.id}`} className={styles.albumCard}>
                <div
                  className={styles.albumCover}
                  style={album.cover_url ? { backgroundImage: `url(${album.cover_url})` } : undefined}
                />
                <span className={styles.albumCardTitle}>{album.title}</span>
                {album.release_date && (
                  <span className={styles.albumCardMeta}>
                    {new Date(album.release_date).getFullYear()}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}

      {singles.length > 0 && <h2 className={styles.sectionTitle}>Singles</h2>}
      {singles.length > 0 ? (
        <TrackList tracks={singles} likedTrackIds={likedTrackIds} />
      ) : (
        (!albums || albums.length === 0) && (
          <EmptyState title="Nothing published yet" description="This artist's music will show up here." />
        )
      )}
    </div>
  );
}
