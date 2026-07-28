"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createTracksBulk, type TrackInput } from "../../../tracks/actions";
import styles from "../../../admin.module.css";

type Album = {
  id: string;
  title: string;
  artist_id: string | null;
  cover_url: string | null;
  release_date: string | null;
};

type Row = {
  file: File;
  title: string;
  trackNumber: number;
  durationSeconds: number | null;
};

function filenameToTitle(filename: string) {
  const withoutExt = filename.replace(/\.[^.]+$/, "");
  const withoutLeadingNumber = withoutExt.replace(/^\s*\d+[\s._-]+/, "");
  return withoutLeadingNumber.replace(/[_-]+/g, " ").trim() || withoutExt;
}

function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const audio = document.createElement("audio");
    const url = URL.createObjectURL(file);
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    audio.src = url;
  });
}

export function BulkTrackForm({ album, nextTrackNumber }: { album: Album; nextTrackNumber: number }) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const durations = await Promise.all(fileArray.map(readDuration));

    setRows(
      fileArray.map((file, i) => ({
        file,
        title: filenameToTitle(file.name),
        trackNumber: nextTrackNumber + i,
        durationSeconds: durations[i],
      }))
    );
  }

  function updateRow(index: number, patch: Partial<Row>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function removeRow(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rows.length === 0) return;
    setSaving(true);
    setError(null);
    setProgress({ done: 0, total: rows.length });

    try {
      const inputs: TrackInput[] = [];
      for (const row of rows) {
        const audioUrl = await uploadToBucket("tracks", row.file);
        inputs.push({
          title: row.title,
          artist_id: album.artist_id,
          album_id: album.id,
          cover_url: album.cover_url,
          audio_url: audioUrl,
          duration_seconds: row.durationSeconds,
          track_number: row.trackNumber,
          release_date: album.release_date,
        });
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }

      await createTracksBulk(inputs);

      router.push("/admin/albums");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
      setProgress(null);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="files">
          Audio files (select all at once)
        </label>
        <input
          id="files"
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {rows.length > 0 && (
        <div className={styles.variantsBlock}>
          {rows.map((row, i) => (
            <div key={i} className={styles.variantRow}>
              <input
                type="number"
                min={1}
                className={styles.input}
                value={row.trackNumber}
                onChange={(e) => updateRow(i, { trackNumber: Number(e.target.value) })}
              />
              <input
                className={styles.input}
                value={row.title}
                onChange={(e) => updateRow(i, { title: e.target.value })}
              />
              <button type="button" className={styles.dangerBtn} onClick={() => removeRow(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {progress && (
        <p className={styles.success}>
          Uploading {progress.done} / {progress.total}…
        </p>
      )}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving || rows.length === 0}>
          {saving ? "Uploading…" : `Add ${rows.length || ""} track${rows.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </form>
  );
}
