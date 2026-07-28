import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import styles from "../shop.module.css";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, price_cents, currency, images")
    .eq("id", id)
    .eq("is_published", true)
    .single();

  if (!product) notFound();

  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, size, stock")
    .eq("product_id", id)
    .order("size", { ascending: true });

  const inStock = (variants ?? []).some((v) => v.stock > 0);

  return (
    <div className={`container ${styles.detail}`}>
      <div className={styles.detailGrid}>
        <div
          className={styles.detailMedia}
          style={product.images?.[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined}
        />
        <div>
          <p className="eyebrow">Shop</p>
          <h1 style={{ marginTop: "0.4rem", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
            {product.name}
          </h1>
          <p className={styles.detailPrice}>{formatPrice(product.price_cents, product.currency)}</p>
          {product.description && <p className={styles.detailDesc}>{product.description}</p>}
          {variants && variants.length > 0 && (
            <div className={styles.sizes}>
              {variants.map((variant) => (
                <span
                  key={variant.id}
                  className={variant.stock > 0 ? styles.size : `${styles.size} ${styles.sizeSoldOut}`}
                >
                  {variant.size}
                  {variant.stock <= 0 && " · sold out"}
                </span>
              ))}
            </div>
          )}
          <div style={{ marginTop: "var(--space-lg)" }}>
            <Button disabled={!inStock}>{inStock ? "Add to cart" : "Sold out"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
