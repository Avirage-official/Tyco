"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createProduct, updateProduct, type ProductInput, type VariantInput } from "./actions";
import styles from "../admin.module.css";

const MAX_IMAGES = 5;

type Product = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  category: string | null;
  images: string[];
};

export function ProductForm({
  product,
  variants: initialVariants,
}: {
  product?: Product;
  variants?: VariantInput[];
}) {
  const router = useRouter();
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? (product.price_cents / 100).toFixed(2) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>(
    initialVariants && initialVariants.length > 0
      ? initialVariants
      : [{ size: "", stock: 0, merchizeVariantCode: "" }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remainingSlots = MAX_IMAGES - images.length - imageFiles.length;

  const previewUrls = useMemo(
    () => imageFiles.map((file) => URL.createObjectURL(file)),
    [imageFiles]
  );

  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  function handleFilesSelected(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, Math.max(0, remainingSlots));
    setImageFiles((prev) => [...prev, ...files]);
  }

  function removeExistingImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveExistingImage(index: number, direction: -1 | 1) {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removePendingFile(index: number) {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariant(index: number, patch: Partial<VariantInput>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const priceCents = Math.round(parseFloat(price || "0") * 100);
      if (!Number.isFinite(priceCents) || priceCents < 0) {
        throw new Error("Enter a valid price.");
      }

      const newImageUrls = await Promise.all(imageFiles.map((file) => uploadToBucket("products", file)));
      const finalImages = [...images, ...newImageUrls];

      const input: ProductInput = {
        name,
        description: description || null,
        price_cents: priceCents,
        category: category || null,
        images: finalImages,
      };

      const cleanVariants = variants.filter((v) => v.size.trim().length > 0);

      if (product) {
        await updateProduct(product.id, input, cleanVariants);
      } else {
        await createProduct(input, cleanVariants);
      }

      router.push("/admin/products");
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

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="price">
            Price (USD)
          </label>
          <input
            id="price"
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="category">
            Category
          </label>
          <input
            id="category"
            className={styles.input}
            placeholder="e.g. Outerwear, Tees"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
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
        <label className={styles.label} htmlFor="images">
          Photos ({images.length + imageFiles.length} / {MAX_IMAGES})
        </label>
        <p className={styles.hint}>
          The first photo is the cover shown in the shop grid. Reorder with the arrows.
        </p>

        {(images.length > 0 || previewUrls.length > 0) && (
          <div className={styles.imageGrid}>
            {images.map((url, i) => (
              <div key={url} className={styles.imageThumb}>
                <div className={styles.preview} style={{ backgroundImage: `url(${url})` }} />
                {i === 0 && <span className={styles.coverBadge}>Cover</span>}
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => moveExistingImage(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => moveExistingImage(i, 1)}
                    disabled={i === images.length - 1}
                    aria-label="Move later"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removeExistingImage(i)}
                    aria-label="Remove photo"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {previewUrls.map((url, i) => (
              <div key={url} className={styles.imageThumb}>
                <div className={styles.preview} style={{ backgroundImage: `url(${url})` }} />
                {images.length === 0 && i === 0 && <span className={styles.coverBadge}>Cover</span>}
                <div className={styles.imageThumbControls}>
                  <button
                    type="button"
                    className={styles.imageThumbBtn}
                    onClick={() => removePendingFile(i)}
                    aria-label="Remove photo"
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
            id="images"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              handleFilesSelected(e.target.files);
              e.target.value = "";
            }}
          />
        ) : (
          <p className={styles.hint}>Remove a photo to add another — {MAX_IMAGES} max.</p>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Sizes &amp; stock</label>
        <p className={styles.hint}>
          Merchize code is that size&rsquo;s variant/SKU code from your Merchize product catalog — required for
          orders of that size to reach fulfilment automatically.
        </p>
        <div className={styles.variantsBlock}>
          {variants.map((variant, i) => (
            <div key={i} className={styles.variantRow}>
              <input
                className={styles.input}
                placeholder="Size (e.g. M)"
                value={variant.size}
                onChange={(e) => updateVariant(i, { size: e.target.value })}
              />
              <input
                type="number"
                min="0"
                className={styles.input}
                placeholder="Stock"
                value={variant.stock}
                onChange={(e) => updateVariant(i, { stock: Number(e.target.value) })}
              />
              <input
                className={styles.input}
                placeholder="Merchize code"
                value={variant.merchizeVariantCode ?? ""}
                onChange={(e) => updateVariant(i, { merchizeVariantCode: e.target.value })}
              />
              <button type="button" className={styles.dangerBtn} onClick={() => removeVariant(i)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.linkBtn}
            style={{ alignSelf: "flex-start" }}
            onClick={() => setVariants((prev) => [...prev, { size: "", stock: 0, merchizeVariantCode: "" }])}
          >
            + Add size
          </button>
        </div>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : product ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}
