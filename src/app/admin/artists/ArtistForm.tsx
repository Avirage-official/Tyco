"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createArtist, updateArtist, type ArtistInput } from "./actions";
import styles from "../admin.module.css";

type Artist = {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  video_url: string | null;
};

export function ArtistForm({ artist }: { artist?: Artist }) {
  const router = useRouter();
  const [name, setName] = useState(artist?.name ?? "");
  const [bio, setBio] = useState(artist?.bio ?? "");
  const photoUrl = artist?.photo_url ?? null;
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const videoUrl = artist?.video_url ?? null;
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        finalPhotoUrl = await uploadToBucket("artists", photoFile);
      }

      let finalVideoUrl = videoUrl;
      if (videoFile) {
        finalVideoUrl = await uploadToBucket("artists", videoFile);
      }

      const input: ArtistInput = {
        name,
        bio: bio || null,
        photo_url: finalPhotoUrl,
        video_url: finalVideoUrl,
      };

      if (artist) {
        await updateArtist(artist.id, input);
      } else {
        await createArtist(input);
      }

      router.push("/admin/artists");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Name
        </label>
        <input
          id="name"
          className={styles.input}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="bio">
          Bio
        </label>
        <textarea id="bio" className={styles.textarea} value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="photo">
          Photo
        </label>
        {photoUrl && <div className={styles.preview} style={{ backgroundImage: `url(${photoUrl})` }} />}
        <input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="video">
          Profile video loop (optional — a short muted clip shown instead of the
          photo on their page)
        </label>
        {videoUrl && (
          <video
            src={videoUrl}
            className={styles.preview}
            autoPlay
            muted
            loop
            playsInline
          />
        )}
        <input
          id="video"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : artist ? "Save changes" : "Create artist"}
        </Button>
      </div>
    </form>
  );
}
