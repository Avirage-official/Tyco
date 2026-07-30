"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IconHeart, IconSearch } from "@/components/icons";
import { TrackList } from "./TrackList";
import { PlayTracksButton } from "./PlayTracksButton";
import detailStyles from "./detail.module.css";
import styles from "./MusicBrowse.module.css";

type Track = {
  id: string;
  title: string;
  artist: string;
  artist_id: string | null;
  album_id: string | null;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  published_at: string | null;
  genre?: string | null;
};

type Album = {
  id: string;
  title: string;
  artist_id: string | null;
  cover_url: string | null;
  release_date: string | null;
};

type Artist = {
  id: string;
  name: string;
  photo_url: string | null;
};

export function MusicBrowse({
  tracks,
  albums,
  artists,
  genres,
  likedTrackIds,
  artistNameById,
}: {
  tracks: Track[];
  albums: Album[];
  artists: Artist[];
  genres: string[];
  likedTrackIds: string[];
  artistNameById: Map<string, string>;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!q) return null;
    return {
      artists: artists.filter((a) => a.name.toLowerCase().includes(q)),
      albums: albums.filter((a) => a.title.toLowerCase().includes(q)),
      genres: genres.filter((g) => g.toLowerCase().includes(q)),
      tracks: tracks.filter(
        (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
      ),
    };
  }, [q, artists, albums, genres, tracks]);

  return (
    <>
      <div className={styles.searchWrap}>
        <IconSearch className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Search artists, albums, tracks, genres"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search music"
        />
      </div>

      {results ? (
        <div className={styles.searchResults}>
          {results.artists.length === 0 &&
          results.albums.length === 0 &&
          results.genres.length === 0 &&
          results.tracks.length === 0 ? (
            <p className={styles.noResults}>Nothing matches &quot;{query}&quot;.</p>
          ) : (
            <>
              {results.artists.length > 0 && (
                <>
                  <h2 className={detailStyles.sectionTitle} style={{ marginTop: 0 }}>
                    Artists
                  </h2>
                  <div className={detailStyles.artistsRow}>
                    {results.artists.map((artist) => (
                      <Link
                        key={artist.id}
                        href={`/music/artists/${artist.id}`}
                        className={detailStyles.artistCard}
                      >
                        <div
                          className={detailStyles.artistPhoto}
                          style={
                            artist.photo_url ? { backgroundImage: `url(${artist.photo_url})` } : undefined
                          }
                        />
                        <span className={detailStyles.artistName}>{artist.name}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {results.genres.length > 0 && (
                <>
                  <h2 className={detailStyles.sectionTitle}>Genres</h2>
                  <div className={detailStyles.genreChips}>
                    {results.genres.map((genre) => (
                      <Link
                        key={genre}
                        href={`/music/genres/${encodeURIComponent(genre)}`}
                        className={detailStyles.genreChip}
                      >
                        {genre}
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {results.albums.length > 0 && (
                <>
                  <h2 className={detailStyles.sectionTitle}>Albums</h2>
                  <div className={detailStyles.albumGrid}>
                    {results.albums.map((album) => (
                      <Link
                        key={album.id}
                        href={`/music/albums/${album.id}`}
                        className={detailStyles.albumCard}
                      >
                        <div
                          className={detailStyles.albumCover}
                          style={
                            album.cover_url ? { backgroundImage: `url(${album.cover_url})` } : undefined
                          }
                        />
                        <span className={detailStyles.albumCardTitle}>{album.title}</span>
                        <span className={detailStyles.albumCardMeta}>
                          {(album.artist_id && artistNameById.get(album.artist_id)) || "Tyco"}
                        </span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {results.tracks.length > 0 && (
                <>
                  <h2 className={detailStyles.sectionTitle}>Tracks</h2>
                  <TrackList tracks={results.tracks} likedTrackIds={likedTrackIds} />
                </>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <div className={detailStyles.quickRow}>
            <PlayTracksButton tracks={tracks} label="Shuffle all" shuffle variant="ghost" />
            <Link href="/music/liked" className={`eyebrow ${detailStyles.likedLink}`}>
              <IconHeart />
              Liked Songs
            </Link>
          </div>

          {artists.length > 0 && (
            <>
              <h2 className={detailStyles.sectionTitle}>Artists</h2>
              <div className={detailStyles.artistsRow}>
                {artists.map((artist) => (
                  <Link
                    key={artist.id}
                    href={`/music/artists/${artist.id}`}
                    className={detailStyles.artistCard}
                  >
                    <div
                      className={detailStyles.artistPhoto}
                      style={artist.photo_url ? { backgroundImage: `url(${artist.photo_url})` } : undefined}
                    />
                    <span className={detailStyles.artistName}>{artist.name}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {genres.length > 0 && (
            <>
              <h2 className={detailStyles.sectionTitle}>Genres</h2>
              <div className={detailStyles.genreChips}>
                {genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/music/genres/${encodeURIComponent(genre)}`}
                    className={detailStyles.genreChip}
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </>
          )}

          {albums.length > 0 && (
            <>
              <h2 className={detailStyles.sectionTitle}>Albums</h2>
              <div className={detailStyles.albumGrid}>
                {albums.map((album) => (
                  <Link key={album.id} href={`/music/albums/${album.id}`} className={detailStyles.albumCard}>
                    <div
                      className={detailStyles.albumCover}
                      style={album.cover_url ? { backgroundImage: `url(${album.cover_url})` } : undefined}
                    />
                    <span className={detailStyles.albumCardTitle}>{album.title}</span>
                    <span className={detailStyles.albumCardMeta}>
                      {(album.artist_id && artistNameById.get(album.artist_id)) || "Tyco"}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {tracks.length > 0 && <h2 className={detailStyles.sectionTitle}>All tracks</h2>}
          {tracks.length > 0 && <TrackList tracks={tracks} likedTrackIds={likedTrackIds} />}
        </>
      )}
    </>
  );
}
