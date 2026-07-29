"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createTrack, updateTrack, type TrackInput } from "./actions";
import styles from "../admin.module.css";

type Track = {
  id: string;
  title: string;
  artist_id: string | null;
  album_id: string | null;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  track_number: number | null;
  release_date: string | null;
  genre: string | null;
};

export function TrackForm({
  track,
  albums,
  artists,
}: {
  track?: Track;
  albums: { id: string; title: string }[];
  artists: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(track?.title ?? "");
  const [artistId, setArtistId] = useState(track?.artist_id ?? "");
  const [albumId, setAlbumId] = useState(track?.album_id ?? "");
  const [trackNumber, setTrackNumber] = useState(track?.track_number?.toString() ?? "");
  const [durationSeconds, setDurationSeconds] = useState(track?.duration_seconds?.toString() ?? "");
  const [releaseDate, setReleaseDate] = useState(track?.release_date ?? "");
  const [genre, setGenre] = useState(track?.genre ?? "");
  const coverUrl = track?.cover_url ?? null;
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const audioUrl = track?.audio_url ?? "";
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalCoverUrl = coverUrl;
      if (coverFile) {
        finalCoverUrl = await uploadToBucket("covers", coverFile);
      }

      let finalAudioUrl = audioUrl;
      if (audioFile) {
        finalAudioUrl = await uploadToBucket("tracks", audioFile);
      }

      if (!finalAudioUrl) {
        throw new Error("An audio file is required.");
      }

      const input: TrackInput = {
        title,
        artist_id: artistId || null,
        album_id: albumId || null,
        cover_url: finalCoverUrl,
        audio_url: finalAudioUrl,
        duration_seconds: durationSeconds ? Number(durationSeconds) : null,
        track_number: trackNumber ? Number(trackNumber) : null,
        release_date: releaseDate || null,
        genre: genre || null,
      };

      if (track) {
        await updateTrack(track.id, input);
      } else {
        await createTrack(input);
      }

      router.push("/admin/tracks");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className={styles.input}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="artist">
            Artist
          </label>
          <select
            id="artist"
            className={styles.select}
            value={artistId}
            onChange={(e) => setArtistId(e.target.value)}
          >
            <option value="">— No artist set —</option>
            {artists.map((artist) => (
              <option key={artist.id} value={artist.id}>
                {artist.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="album">
          Album (optional — leave blank for a single)
        </label>
        <select
          id="album"
          className={styles.select}
          value={albumId}
          onChange={(e) => setAlbumId(e.target.value)}
        >
          <option value="">— Single —</option>
          {albums.map((album) => (
            <option key={album.id} value={album.id}>
              {album.title}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="track_number">
            Track number
          </label>
          <input
            id="track_number"
            type="number"
            min={1}
            className={styles.input}
            value={trackNumber}
            onChange={(e) => setTrackNumber(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="duration">
            Duration (seconds)
          </label>
          <input
            id="duration"
            type="number"
            min={1}
            className={styles.input}
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="release_date">
            Release date
          </label>
          <input
            id="release_date"
            type="date"
            className={styles.input}
            value={releaseDate ?? ""}
            onChange={(e) => setReleaseDate(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="genre">
            Genre
          </label>
          <input
            id="genre"
            className={styles.input}
            list="genre-suggestions"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          />
          <datalist id="genre-suggestions">
            <option value="Afrobeat" />
            <option value="Hip-Hop" />
            <option value="R&B" />
            <option value="Pop" />
            <option value="Electronic" />
            <option value="Soul" />
            <option value="Alternative" />
            <option value="Jazz" />
          </datalist>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover">
          Cover art
        </label>
        {coverUrl && <div className={styles.preview} style={{ backgroundImage: `url(${coverUrl})` }} />}
        <input
          id="cover"
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="audio">
          Audio file {audioUrl && "(uploaded — pick a new file to replace)"}
        </label>
        <input
          id="audio"
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : track ? "Save changes" : "Create track"}
        </Button>
      </div>
    </form>
  );
}
