import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconHeart } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getLikedTrackIds } from "@/lib/music/liked";
import { TrackList } from "./TrackList";
import { PlayTracksButton } from "./PlayTracksButton";
import styles from "./detail.module.css";

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

  return (
    <>
      <PageHeader
        eyebrow="Free, always"
        title="Music"
        description="Every track we've put out, free to stream — no account, no paywall."
      />
      <div className="container">
        <div className={styles.quickRow}>
          <PlayTracksButton tracks={tracksWithArtist} label="Shuffle all" shuffle variant="ghost" />
          <Link href="/music/liked" className={`eyebrow ${styles.likedLink}`}>
            <IconHeart />
            Liked Songs
          </Link>
        </div>

        {artists && artists.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>
              Artists
            </h2>
            <div className={styles.artistsRow}>
              {artists.map((artist) => (
                <Link key={artist.id} href={`/music/artists/${artist.id}`} className={styles.artistCard}>
                  <div
                    className={styles.artistPhoto}
                    style={artist.photo_url ? { backgroundImage: `url(${artist.photo_url})` } : undefined}
                  />
                  <span className={styles.artistName}>{artist.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}

        {genres.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>
              Genres
            </h2>
            <div className={styles.genreChips}>
              {genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/music/genres/${encodeURIComponent(genre)}`}
                  className={styles.genreChip}
                >
                  {genre}
                </Link>
              ))}
            </div>
          </>
        )}

        {albums && albums.length > 0 && (
          <>
            <h2 className={styles.sectionTitle}>
              Albums
            </h2>
            <div className={styles.albumGrid}>
              {albums.map((album) => (
                <Link key={album.id} href={`/music/albums/${album.id}`} className={styles.albumCard}>
                  <div
                    className={styles.albumCover}
                    style={album.cover_url ? { backgroundImage: `url(${album.cover_url})` } : undefined}
                  />
                  <span className={styles.albumCardTitle}>{album.title}</span>
                  <span className={styles.albumCardMeta}>
                    {(album.artist_id && artistNameById.get(album.artist_id)) || "Tyco"}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {tracksWithArtist.length > 0 && <h2 className={styles.sectionTitle}>All tracks</h2>}
        {tracksWithArtist.length > 0 ? (
          <TrackList tracks={tracksWithArtist} likedTrackIds={likedTrackIds} />
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
