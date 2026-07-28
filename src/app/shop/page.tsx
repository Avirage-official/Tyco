import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewBadge } from "@/components/ui/NewBadge";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, isNew } from "@/lib/format";
import styles from "./shop.module.css";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, images, published_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="Small runs"
        title="Shop"
        description="Clothing cut from the same idea as the sound — made to be worn in, not just worn."
      />
      <div className="container">
        {products && products.length > 0 ? (
          <div className={styles.grid}>
            {products.map((product) => (
              <Link key={product.id} href={`/shop/${product.id}`} className={styles.card}>
                <div
                  className={styles.media}
                  style={
                    product.images?.[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined
                  }
                />
                <div className={styles.body}>
                  <span className={styles.name}>
                    {product.name} {isNew(product.published_at) && <NewBadge />}
                  </span>
                  <span className={styles.price}>
                    {formatPrice(product.price_cents, product.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="The rack is being stocked"
            description="Products published from Supabase will show up here, ready to order."
          />
        )}
      </div>
    </>
  );
}
