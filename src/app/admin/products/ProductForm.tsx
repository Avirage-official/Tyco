"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { createProduct, updateProduct, type ProductInput, type VariantInput } from "./actions";
import styles from "../admin.module.css";

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
  const images = product?.images ?? [];
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [variants, setVariants] = useState<VariantInput[]>(
    initialVariants && initialVariants.length > 0 ? initialVariants : [{ size: "", stock: 0 }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          Images {images.length > 0 && `(${images.length} already uploaded)`}
        </label>
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Sizes &amp; stock</label>
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
              <button type="button" className={styles.dangerBtn} onClick={() => removeVariant(i)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.linkBtn}
            style={{ alignSelf: "flex-start" }}
            onClick={() => setVariants((prev) => [...prev, { size: "", stock: 0 }])}
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
