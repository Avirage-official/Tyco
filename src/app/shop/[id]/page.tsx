import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { Gallery } from "./Gallery";
import { AddToCartForm } from "./AddToCartForm";
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

  return (
    <div className={`container ${styles.detail}`}>
      <div className={styles.detailGrid}>
        <Gallery images={product.images ?? []} alt={product.name} />
        <div>
          <p className="eyebrow">Shop</p>
          <h1 style={{ marginTop: "0.4rem", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
            {product.name}
          </h1>
          <p className={styles.detailPrice}>{formatPrice(product.price_cents, product.currency)}</p>
          {product.description && <p className={styles.detailDesc}>{product.description}</p>}
          <AddToCartForm
            productId={product.id}
            productName={product.name}
            priceCents={product.price_cents}
            currency={product.currency}
            coverUrl={product.images?.[0] ?? null}
            variants={variants ?? []}
          />
        </div>
      </div>
    </div>
  );
}
