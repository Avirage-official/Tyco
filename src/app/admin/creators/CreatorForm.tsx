"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import type { AboutSlide, CreatorType } from "@/lib/supabase/types";
import { createCreator, updateCreator, type CreatorInput, type WorkInput } from "./actions";
import styles from "../admin.module.css";

const MAX_GALLERY = 5;

const TYPE_OPTIONS: { value: CreatorType; label: string }[] = [
  { value: "musician", label: "Musician" },
  { value: "visual_artist", label: "Visual artist" },
  { value: "influencer", label: "Influencer" },
  { value: "designer", label: "Designer" },
  { value: "photographer", label: "Photographer" },
  { value: "other", label: "Other" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type Creator = {
  id: string;
  slug: string;
  name: string;
  type: CreatorType;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  gallery: AboutSlide[];
  tags: string[];
  is_featured: boolean;
};

type WorkRow = { title: string; description: string; cover_url: string | null; external_url: string };

export function CreatorForm({
  creator,
  works: initialWorks,
  notes: initialNotes,
}: {
  creator?: Creator;
  works?: WorkInput[];
  notes?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(creator?.name ?? "");
  const [slug, setSlug] = useState(creator?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(creator));
  const [type, setType] = useState<CreatorType>(creator?.type ?? "musician");
  const [tagline, setTagline] = useState(creator?.tagline ?? "");
  const [location, setLocation] = useState(creator?.location ?? "");
  const [bio, setBio] = useState(creator?.bio ?? "");
  const [tags, setTags] = useState((creator?.tags ?? []).join(", "));
  const [websiteUrl, setWebsiteUrl] = useState(creator?.website_url ?? "");
  const [instagramUrl, setInstagramUrl] = useState(creator?.instagram_url ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(creator?.tiktok_url ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(creator?.youtube_url ?? "");
  const [spotifyUrl, setSpotifyUrl] = useState(creator?.spotify_url ?? "");
  const [isFeatured, setIsFeatured] = useState(creator?.is_featured ?? false);
  const [notes, setNotes] = useState(initialNotes ?? "");

  const avatarUrl = creator?.avatar_url ?? null;
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const bannerUrl = creator?.banner_url ?? null;
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const [gallery, setGallery] = useState<AboutSlide[]>(creator?.gallery ?? []);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [works, setWorks] = useState<WorkRow[]>(
    (initialWorks ?? []).map((w) => ({
      title: w.title,
      description: w.description ?? "",
      cover_url: w.cover_url,
      external_url: w.external_url ?? "",
    }))
  );
  const [workFiles, setWorkFiles] = useState<(File | null)[]>((initialWorks ?? []).map(() => null));

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingGallerySlots = MAX_GALLERY - gallery.length - galleryFiles.length;

  const galleryPreviewUrls = useMemo(
    () => galleryFiles.map((file) => URL.createObjectURL(file)),
    [galleryFiles]
  );

  useEffect(() => {
    return () => galleryPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [galleryPreviewUrls]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleGalleryFilesSelected(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, Math.max(0, remainingGallerySlots));
    setGalleryFiles((prev) => [...prev, ...files]);
  }

  function removeExistingGalleryItem(index: number) {
    setGallery((prev) => prev.filter((_, i) => i !== index));
  }

  function moveExistingGalleryItem(index: number, direction: -1 | 1) {
    setGallery((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePendingGalleryFile(index: number) {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateWork(index: number, patch: Partial<WorkRow>) {
    setWorks((prev) => prev.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  }

  function addWork() {
    setWorks((prev) => [...prev, { title: "", description: "", cover_url: null, external_url: "" }]);
    setWorkFiles((prev) => [...prev, null]);
  }

  function removeWork(index: number) {
    setWorks((prev) => prev.filter((_, i) => i !== index));
    setWorkFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function setWorkFile(index: number, file: File | null) {
    setWorkFiles((prev) => prev.map((f, i) => (i === index ? file : f)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const finalSlug = slug || slugify(name);
      if (!finalSlug) throw new Error("Enter a name or slug.");

      const finalAvatarUrl = avatarFile ? await uploadToBucket("creators", avatarFile) : avatarUrl;
      const finalBannerUrl = bannerFile ? await uploadToBucket("creators", bannerFile) : bannerUrl;

      const newGalleryItems: AboutSlide[] = await Promise.all(
        galleryFiles.map(async (file): Promise<AboutSlide> => {
          const itemType: AboutSlide["type"] = file.type.startsWith("video/") ? "video" : "image";
          return { url: await uploadToBucket("creators", file), type: itemType };
        })
      );

      const input: CreatorInput = {
        slug: finalSlug,
        name,
        type,
        tagline: tagline || null,
        bio: bio || null,
        location: location || null,
        website_url: websiteUrl || null,
        instagram_url: instagramUrl || null,
        tiktok_url: tiktokUrl || null,
        youtube_url: youtubeUrl || null,
        spotify_url: spotifyUrl || null,
        avatar_url: finalAvatarUrl,
        banner_url: finalBannerUrl,
        gallery: [...gallery, ...newGalleryItems],
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        is_featured: isFeatured,
      };

      const finalWorks: WorkInput[] = await Promise.all(
        works.map(async (work, i): Promise<WorkInput> => {
          const file = workFiles[i];
          const coverUrl = file ? await uploadToBucket("creators", file) : work.cover_url;
          return {
            title: work.title,
            description: work.description || null,
            cover_url: coverUrl,
            external_url: work.external_url || null,
          };
        })
      );

      if (creator) {
        await updateCreator(creator.id, input, finalWorks, notes);
      } else {
        await createCreator(input, finalWorks, notes);
      }

      router.push("/admin/creators");
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
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className={styles.input}
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="slug">
            URL slug
          </label>
          <input
            id="slug"
            className={styles.input}
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
          />
        </div>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="type">
            Type
          </label>
          <select
            id="type"
            className={styles.select}
            value={type}
            onChange={(e) => setType(e.target.value as CreatorType)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="location">
            Location
          </label>
          <input
            id="location"
            className={styles.input}
            placeholder="e.g. Singapore"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="tagline">
          Tagline
        </label>
        <input
          id="tagline"
          className={styles.input}
          placeholder="e.g. Producer & vocalist"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="bio">
          Story / description
        </label>
        <textarea
          id="bio"
          className={styles.textarea}
          style={{ minHeight: "10rem" }}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="tags">
          Tags
        </label>
        <input
          id="tags"
          className={styles.input}
          placeholder="comma separated, e.g. hip-hop, streetwear"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </div>

      <div className={styles.checkboxRow}>
        <input
          id="featured"
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
        />
        <label htmlFor="featured">Feature this creator</label>
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Links</h3>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="website">
            Website
          </label>
          <input
            id="website"
            className={styles.input}
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="instagram">
            Instagram
          </label>
          <input
            id="instagram"
            className={styles.input}
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tiktok">
            TikTok
          </label>
          <input
            id="tiktok"
            className={styles.input}
            type="url"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="youtube">
            YouTube
          </label>
          <input
            id="youtube"
            className={styles.input}
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="spotify">
          Spotify
        </label>
        <input
          id="spotify"
          className={styles.input}
          type="url"
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
        />
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Photos</h3>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="avatar">
          Avatar
        </label>
        {avatarUrl && <div className={styles.preview} style={{ backgroundImage: `url(${avatarUrl})` }} />}
        <input
          id="avatar"
          type="file"
          accept="image/*"
          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="banner">
          Banner
        </label>
        {bannerUrl && <div className={styles.preview} style={{ backgroundImage: `url(${bannerUrl})` }} />}
        <input
          id="banner"
          type="file"
          accept="image/*"
          onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="gallery">
          Side photos ({gallery.length + galleryFiles.length} / {MAX_GALLERY})
        </label>
        <p className={styles.hint}>Photos or short clips shown alongside the story. Reorder with the arrows.</p>

        {(gallery.length > 0 || galleryPreviewUrls.length > 0) && (
          <div className={styles.imageGrid}>
            {gallery.map((item, i) => (
              <div key={item.url} className={styles.imageThumb}>
                {item.type === "video" ? (
                  <video className={styles.preview} src={item.url} muted loop autoPlay playsInline />
                ) : (
                  <div className={styles.preview} style={{ backgroundImage: `url(${item.url})` }} />
                )}
                {item.type === "video" && <span className={styles.coverBadge}>Video</span>}
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => moveExistingGalleryItem(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => moveExistingGalleryItem(i, 1)}
                    disabled={i === gallery.length - 1}
                    aria-label="Move later"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removeExistingGalleryItem(i)}
                    aria-label="Remove photo"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {galleryFiles.map((file, i) => (
              <div key={galleryPreviewUrls[i]} className={styles.imageThumb}>
                {file.type.startsWith("video/") ? (
                  <video className={styles.preview} src={galleryPreviewUrls[i]} muted loop autoPlay playsInline />
                ) : (
                  <div className={styles.preview} style={{ backgroundImage: `url(${galleryPreviewUrls[i]})` }} />
                )}
                {file.type.startsWith("video/") && <span className={styles.coverBadge}>Video</span>}
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removePendingGalleryFile(i)}
                    aria-label="Remove photo"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {remainingGallerySlots > 0 ? (
          <input
            id="gallery"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={(e) => {
              handleGalleryFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
        ) : (
          <p className={styles.hint}>Remove a photo to add another — {MAX_GALLERY} max.</p>
        )}
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Works</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Storytelling pieces shown on their page — a release, a shoot, a past collab. Not necessarily for sale;
        products they sell are managed separately under Products.
      </p>

      <div className={styles.variantsBlock}>
        {works.map((work, i) => (
          <div key={i} className={styles.field} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "var(--space-sm)" }}>
            <div className={styles.fieldRow}>
              <input
                className={styles.input}
                placeholder="Title"
                value={work.title}
                onChange={(e) => updateWork(i, { title: e.target.value })}
              />
              <input
                className={styles.input}
                type="url"
                placeholder="Link (optional)"
                value={work.external_url}
                onChange={(e) => updateWork(i, { external_url: e.target.value })}
              />
            </div>
            <textarea
              className={styles.textarea}
              placeholder="Short description (optional)"
              value={work.description}
              onChange={(e) => updateWork(i, { description: e.target.value })}
            />
            {work.cover_url && (
              <div className={styles.preview} style={{ backgroundImage: `url(${work.cover_url})` }} />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setWorkFile(i, e.target.files?.[0] ?? null)}
            />
            <button type="button" className={styles.dangerBtn} style={{ alignSelf: "flex-start" }} onClick={() => removeWork(i)}>
              Remove work
            </button>
          </div>
        ))}
        <button type="button" className={styles.linkBtn} style={{ alignSelf: "flex-start" }} onClick={addWork}>
          + Add work
        </button>
      </div>

      <h3 style={{ marginTop: "var(--space-lg)" }}>Internal notes</h3>
      <p style={{ color: "var(--fg-muted)", fontSize: "0.85rem", marginBottom: "var(--space-sm)" }}>
        Deal terms, contact info — visible to admins only, never shown on the public page.
      </p>
      <div className={styles.field}>
        <textarea className={styles.textarea} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : creator ? "Save changes" : "Create creator"}
        </Button>
      </div>
    </form>
  );
}
