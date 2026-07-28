"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createAlbum, updateAlbum, type AlbumInput } from "./actions";
import styles from "../admin.module.css";

type Album = {
  id: string;
  title: string;
  cover_url: string | null;
  release_date: string | null;
};

export function AlbumForm({ album }: { album?: Album }) {
  const router = useRouter();
  const [title, setTitle] = useState(album?.title ?? "");
  const [releaseDate, setReleaseDate] = useState(album?.release_date ?? "");
  const coverUrl = album?.cover_url ?? null;
  const [coverFile, setCoverFile] = useState<File | null>(null);
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

      const input: AlbumInput = {
        title,
        cover_url: finalCoverUrl,
        release_date: releaseDate || null,
      };

      if (album) {
        await updateAlbum(album.id, input);
      } else {
        await createAlbum(input);
      }

      router.push("/admin/albums");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : album ? "Save changes" : "Create album"}
        </Button>
      </div>
    </form>
  );
}
