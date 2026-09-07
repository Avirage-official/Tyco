import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { SwipeDashboard } from "@/components/home/SwipeDashboard";
import { Marquee } from "@/components/motion/Marquee";
import { getSwipeDashboardData } from "@/lib/home/swipe-data";
import { createClient } from "@/lib/supabase/server";
import { ShopGrid } from "./ShopGrid";
import styles from "./shop.module.css";

export const metadata: Metadata = { title: "Shop" };

const MARQUEE_ITEMS = ["Wear The Collective", "New Arrivals", "Shop", "Tyco"];

export default async function ShopPage() {
  const supabase = await createClient();
  const [{ data: products }, swipeData] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, price_cents, currency, images, category, published_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false }),
    getSwipeDashboardData(supabase),
  ]);

  return (
    <>
      <SwipeDashboard {...swipeData} initialSlide={0} />
      <Marquee items={MARQUEE_ITEMS} />

      <div className={styles.shopBody}>
        <div className={styles.pageHead}>
          <p className="eyebrow">The rack</p>
          <h1 className={styles.pageHeadTitle}>Shop</h1>
          <p className={styles.pageHeadDesc}>
            Apparel that carries the culture — every piece funds the artists and
            creatives the collective backs.
          </p>
        </div>

        {products && products.length > 0 ? (
          <ShopGrid products={products} />
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
