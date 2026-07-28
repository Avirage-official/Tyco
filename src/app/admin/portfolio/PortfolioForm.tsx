"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createPortfolioItem, updatePortfolioItem, type PortfolioInput } from "./actions";
import styles from "../admin.module.css";

type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  images: string[];
};

export function PortfolioForm({ item }: { item?: PortfolioItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const coverUrl = item?.cover_url ?? null;
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const images = item?.images ?? [];
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let finalCoverUrl = coverUrl;
      if (coverFile) {
        finalCoverUrl = await uploadToBucket("portfolio", coverFile);
      }

      const newImageUrls = await Promise.all(
        galleryFiles.map((file) => uploadToBucket("portfolio", file))
      );
      const finalImages = [...images, ...newImageUrls];

      const input: PortfolioInput = {
        title,
        description: description || null,
        category: category || null,
        cover_url: finalCoverUrl,
        images: finalImages,
      };

      if (item) {
        await updatePortfolioItem(item.id, input);
      } else {
        await createPortfolioItem(input);
      }

      router.push("/admin/portfolio");
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
        <label className={styles.label} htmlFor="category">
          Category
        </label>
        <input
          id="category"
          className={styles.input}
          placeholder="e.g. Photography, Film, Design"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover">
          Cover image
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
        <label className={styles.label} htmlFor="gallery">
          Gallery images {images.length > 0 && `(${images.length} already uploaded)`}
        </label>
        <input
          id="gallery"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : item ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  );
}
