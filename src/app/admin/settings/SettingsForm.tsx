"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import type { AboutSlide } from "@/lib/supabase/types";
import { updateSiteSettings } from "./actions";
import styles from "../admin.module.css";

const MAX_SLIDES = 8;

type Settings = {
  next_project_title: string | null;
  next_project_body: string | null;
  next_project_image_url: string | null;
  mission_raised_cents: number;
  mission_goal_cents: number;
  about_gallery: AboutSlide[];
} | null;

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [title, setTitle] = useState(settings?.next_project_title ?? "");
  const [body, setBody] = useState(settings?.next_project_body ?? "");
  const imageUrl = settings?.next_project_image_url ?? null;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [raised, setRaised] = useState(String((settings?.mission_raised_cents ?? 0) / 100));
  const [goal, setGoal] = useState(String((settings?.mission_goal_cents ?? 0) / 100));
  const [slides, setSlides] = useState<AboutSlide[]>(settings?.about_gallery ?? []);
  const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = MAX_SLIDES - slides.length - slideFiles.length;

  const previewUrls = useMemo(
    () => slideFiles.map((file) => URL.createObjectURL(file)),
    [slideFiles]
  );

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  function handleSlideFilesSelected(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, Math.max(0, remainingSlots));
    setSlideFiles((prev) => [...prev, ...files]);
  }

  function removeExistingSlide(index: number) {
    setSlides((prev) => prev.filter((_, i) => i !== index));
  }

  function moveExistingSlide(index: number, direction: -1 | 1) {
    setSlides((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePendingSlideFile(index: number) {
    setSlideFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const finalImageUrl = imageFile ? await uploadToBucket("portfolio", imageFile) : imageUrl;

      const newSlides: AboutSlide[] = await Promise.all(
        slideFiles.map(async (file): Promise<AboutSlide> => {
          const type: AboutSlide["type"] = file.type.startsWith("video/") ? "video" : "image";
          return { url: await uploadToBucket("about", file), type };
        })
      );

      await updateSiteSettings({
        next_project_title: title || null,
        next_project_body: body || null,
        next_project_image_url: finalImageUrl,
        mission_raised_cents: Math.round(Number(raised) * 100) || 0,
        mission_goal_cents: Math.round(Number(goal) * 100) || 0,
        about_gallery: [...slides, ...newSlides],
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
      <h3>Front page slideshow</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Photos and short clips shown on the signed-out front page. Reorder with the arrows —
        empty is fine, the slideshow just won&apos;t render.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="slides">
          Slides ({slides.length + slideFiles.length} / {MAX_SLIDES})
        </label>

        {(slides.length > 0 || previewUrls.length > 0) && (
          <div className={styles.imageGrid}>
            {slides.map((slide, i) => (
              <div key={slide.url} className={styles.imageThumb}>
                {slide.type === "video" ? (
                  <video className={styles.preview} src={slide.url} muted loop autoPlay playsInline />
                ) : (
                  <div className={styles.preview} style={{ backgroundImage: `url(${slide.url})` }} />
                )}
                {slide.type === "video" && <span className={styles.coverBadge}>Video</span>}
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => moveExistingSlide(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => moveExistingSlide(i, 1)}
                    disabled={i === slides.length - 1}
                    aria-label="Move later"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removeExistingSlide(i)}
                    aria-label="Remove slide"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {slideFiles.map((file, i) => (
              <div key={previewUrls[i]} className={styles.imageThumb}>
                {file.type.startsWith("video/") ? (
                  <video className={styles.preview} src={previewUrls[i]} muted loop autoPlay playsInline />
                ) : (
                  <div className={styles.preview} style={{ backgroundImage: `url(${previewUrls[i]})` }} />
                )}
                {file.type.startsWith("video/") && <span className={styles.coverBadge}>Video</span>}
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removePendingSlideFile(i)}
                    aria-label="Remove slide"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {remainingSlots > 0 ? (
          <input
            id="slides"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              handleSlideFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
        ) : (
          <p className={styles.hint}>Remove a slide to add another — {MAX_SLIDES} max.</p>
        )}
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Next project teaser</h3>
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
