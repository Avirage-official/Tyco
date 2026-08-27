import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewBadge } from "@/components/ui/NewBadge";
import { SwipeDashboard } from "@/components/home/SwipeDashboard";
import { getSwipeDashboardData } from "@/lib/home/swipe-data";
import { createClient } from "@/lib/supabase/server";
import { formatPrice, isNew } from "@/lib/format";
import styles from "./shop.module.css";

export const metadata: Metadata = { title: "Shop" };

export default async function ShopPage() {
  const supabase = await createClient();
  const [{ data: products }, swipeData] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price_cents, currency, images, published_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    getSwipeDashboardData(supabase),
  ]);

  return (
    <>
      <SwipeDashboard {...swipeData} initialSlide={0} />
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
