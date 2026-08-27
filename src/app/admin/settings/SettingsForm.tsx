"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import type { AboutSlide, DashboardSlideImages } from "@/lib/supabase/types";
import { updateSiteSettings } from "./actions";
import styles from "../admin.module.css";

const MAX_SLIDES = 8;

const SWIPE_SLIDES: { key: keyof DashboardSlideImages; label: string }[] = [
  { key: "retail", label: "Retail" },
  { key: "happenings", label: "Happenings" },
  { key: "creators", label: "Creators" },
  { key: "services", label: "Services" },
];

type Settings = {
  next_project_title: string | null;
  next_project_body: string | null;
  next_project_image_url: string | null;
  mission_raised_cents: number;
  mission_goal_cents: number;
  mission_blurb: string | null;
  about_gallery: AboutSlide[];
  dashboard_slide_images: DashboardSlideImages;
} | null;

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [title, setTitle] = useState(settings?.next_project_title ?? "");
  const [body, setBody] = useState(settings?.next_project_body ?? "");
  const imageUrl = settings?.next_project_image_url ?? null;
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [raised, setRaised] = useState(String((settings?.mission_raised_cents ?? 0) / 100));
  const [goal, setGoal] = useState(String((settings?.mission_goal_cents ?? 0) / 100));
  const [missionBlurb, setMissionBlurb] = useState(settings?.mission_blurb ?? "");
  const [slides, setSlides] = useState<AboutSlide[]>(settings?.about_gallery ?? []);
  const [slideFiles, setSlideFiles] = useState<File[]>([]);
  const [swipeImages, setSwipeImages] = useState<DashboardSlideImages>(
    settings?.dashboard_slide_images ?? {}
  );
  const [swipeImageFiles, setSwipeImageFiles] = useState<Partial<Record<keyof DashboardSlideImages, File>>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Captured once on mount — the storage objects a save might orphan, so we
  // know what to clean up afterward regardless of how `slides`/`imageUrl`
  // get mutated in the meantime.
  const initialSlideUrls = useRef(new Set((settings?.about_gallery ?? []).map((s) => s.url))).current;
  const initialImageUrl = useRef(imageUrl).current;
  const initialSwipeImages = useRef(settings?.dashboard_slide_images ?? {}).current;

  const swipeImagePreviews = useMemo(() => {
    const previews: Partial<Record<keyof DashboardSlideImages, string>> = {};
    for (const { key } of SWIPE_SLIDES) {
      const file = swipeImageFiles[key];
      if (file) previews[key] = URL.createObjectURL(file);
    }
    return previews;
  }, [swipeImageFiles]);

  useEffect(() => {
    return () => Object.values(swipeImagePreviews).forEach((url) => url && URL.revokeObjectURL(url));
  }, [swipeImagePreviews]);

  function setSwipeImageFile(key: keyof DashboardSlideImages, file: File | null) {
    setSwipeImageFiles((prev) => {
      const next = { ...prev };
      if (file) next[key] = file;
      else delete next[key];
      return next;
    });
  }

  function removeSwipeImage(key: keyof DashboardSlideImages) {
    setSwipeImages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSwipeImageFile(key, null);
  }

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

      const finalSwipeImages: DashboardSlideImages = { ...swipeImages };
      for (const { key } of SWIPE_SLIDES) {
        const file = swipeImageFiles[key];
        if (file) finalSwipeImages[key] = await uploadToBucket("about", file);
      }

      await updateSiteSettings({
        next_project_title: title || null,
        next_project_body: body || null,
        next_project_image_url: finalImageUrl,
        mission_raised_cents: Math.round(Number(raised) * 100) || 0,
        mission_goal_cents: Math.round(Number(goal) * 100) || 0,
        mission_blurb: missionBlurb || null,
        about_gallery: [...slides, ...newSlides],
        dashboard_slide_images: finalSwipeImages,
      });

      // Save succeeded — now safe to clean up whatever it orphaned. Best
      // effort: a cleanup failure shouldn't surface as a save failure.
      const keptSlideUrls = new Set(slides.map((s) => s.url));
      const removedSlideUrls = [...initialSlideUrls].filter((url) => !keptSlideUrls.has(url));
      const toDelete = removedSlideUrls.map((url) => deleteFromBucket("about", url));
      if (finalImageUrl !== initialImageUrl && initialImageUrl) {
        toDelete.push(deleteFromBucket("portfolio", initialImageUrl));
      }
      for (const { key } of SWIPE_SLIDES) {
        const oldUrl = initialSwipeImages[key];
        const newUrl = finalSwipeImages[key];
        if (oldUrl && oldUrl !== newUrl) toDelete.push(deleteFromBucket("about", oldUrl));
      }
      await Promise.allSettled(toDelete);

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

      <h3 style={{ marginTop: "var(--space-lg)" }}>Explore section backgrounds</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Background photo for each slide of the swipeable Retail / Happenings / Creators / Services
        section — shown on the dashboard and reused as the hero on /shop, /studio, and /creators.
        Optional — a slide with no image just keeps a plain background.
      </p>

      {SWIPE_SLIDES.map(({ key, label }) => {
        const previewUrl = swipeImagePreviews[key] ?? swipeImages[key];
        return (
          <div key={key} className={styles.field}>
            <label className={styles.label} htmlFor={`swipe-${key}`}>
              {label}
            </label>
            {previewUrl && (
              <div className={styles.imageThumb} style={{ maxWidth: 220 }}>
                <div className={styles.preview} style={{ backgroundImage: `url(${previewUrl})` }} />
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removeSwipeImage(key)}
                    aria-label={`Remove ${label} background`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
            <input
              id={`swipe-${key}`}
              type="file"
              accept="image/*"
              onChange={(e) => {
                setSwipeImageFile(key, e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        );
      })}

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

      <h3 style={{ marginTop: "var(--space-lg)" }}>The mission</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Shown on the dashboard as a quiet, animated strip — not a number. Say what the fund is
        for right now, in a line or two. Leave it blank to hide the strip entirely.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="mission-blurb">
          What we&rsquo;re funding
        </label>
        <textarea
          id="mission-blurb"
          className={styles.textarea}
          placeholder="A line about where the fund is headed right now."
          value={missionBlurb}
          onChange={(e) => setMissionBlurb(e.target.value)}
        />
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Mission fund progress</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Kept for the record — not shown on the homepage. Set the goal to 0 if there&rsquo;s
        nothing to track yet.
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
