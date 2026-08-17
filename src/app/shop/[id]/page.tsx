import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Accordion } from "@/components/ui/Accordion";
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
    .select("id, name, description, price_cents, currency, images, category")
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
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/shop">Shop</Link>
        {product.category && (
          <>
            <span aria-hidden>/</span>
            <span>{product.category}</span>
          </>
        )}
        <span aria-hidden>/</span>
        <span aria-current="page">{product.name}</span>
      </nav>

      <div className={styles.detailGrid}>
        <Gallery images={product.images ?? []} alt={product.name} />
        <div>
          {product.category && <p className="eyebrow">{product.category}</p>}
          <h1 style={{ marginTop: "0.4rem", fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
            {product.name}
          </h1>
          <p className={styles.detailPrice}>{formatPrice(product.price_cents, product.currency)}</p>

          <AddToCartForm
            productId={product.id}
            productName={product.name}
            priceCents={product.price_cents}
            currency={product.currency}
            coverUrl={product.images?.[0] ?? null}
            variants={variants ?? []}
          />

          <div className={styles.accordions}>
            {product.description && (
              <Accordion title="Product details">
                <p>{product.description}</p>
              </Accordion>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
