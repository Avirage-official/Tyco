"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { updateSiteSettings } from "./actions";
import styles from "../admin.module.css";

type Settings = {
  next_project_title: string | null;
  next_project_body: string | null;
  next_project_image_url: string | null;
  mission_raised_cents: number;
  mission_goal_cents: number;
} | null;

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [title, setTitle] = useState(settings?.next_project_title ?? "");
  const [body, setBody] = useState(settings?.next_project_body ?? "");
  const imageUrl = settings?.next_project_image_url ?? null;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [raised, setRaised] = useState(String((settings?.mission_raised_cents ?? 0) / 100));
  const [goal, setGoal] = useState(String((settings?.mission_goal_cents ?? 0) / 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const finalImageUrl = imageFile ? await uploadToBucket("portfolio", imageFile) : imageUrl;

      await updateSiteSettings({
        next_project_title: title || null,
        next_project_body: body || null,
        next_project_image_url: finalImageUrl,
        mission_raised_cents: Math.round(Number(raised) * 100) || 0,
        mission_goal_cents: Math.round(Number(goal) * 100) || 0,
      });

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3>Next project teaser</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Shown on the dashboard for signed-in visitors. Leave the title blank to hide it.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="next-title">
          Title
        </label>
        <input
          id="next-title"
          className={styles.input}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="next-body">
          Short description
        </label>
        <textarea
          id="next-body"
          className={styles.textarea}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="next-image">
          Image
        </label>
        {imageUrl && <div className={styles.preview} style={{ backgroundImage: `url(${imageUrl})` }} />}
        <input
          id="next-image"
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Mission fund progress</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Shown on the dashboard as a progress bar. Set the goal to 0 to hide it.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="raised">
          Raised (USD)
        </label>
        <input
          id="raised"
          className={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={raised}
          onChange={(e) => setRaised(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="goal">
          Goal (USD)
        </label>
        <input
          id="goal"
          className={styles.input}
          type="number"
          min="0"
          step="0.01"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
