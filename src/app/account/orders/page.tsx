import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getMerchizeOrderProgress, type MerchizeProgressStep } from "@/lib/checkout/merchize";
import { OrderList } from "./OrderList";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/orders");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, status, currency, total_cents, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const orderIds = (orders ?? []).map((o) => o.id);

  type OrderItemRow = { order_id: string; variant_id: string; quantity: number; unit_price_cents: number };
  let items: OrderItemRow[] = [];
  if (orderIds.length > 0) {
    const { data } = await supabase
      .from("order_items")
      .select("order_id, variant_id, quantity, unit_price_cents")
      .in("order_id", orderIds);
    items = data ?? [];
  }

  const variantIds = Array.from(new Set(items.map((i) => i.variant_id)));
  type VariantRow = { id: string; size: string; product_id: string };
  let variants: VariantRow[] = [];
  if (variantIds.length > 0) {
    const { data } = await supabase.from("product_variants").select("id, size, product_id").in("id", variantIds);
    variants = data ?? [];
  }

  const productIds = Array.from(new Set(variants.map((v) => v.product_id)));
  type ProductRow = { id: string; name: string; images: string[] };
  let products: ProductRow[] = [];
  if (productIds.length > 0) {
    const { data } = await supabase.from("products").select("id, name, images").in("id", productIds);
    products = data ?? [];
  }

  const variantById = new Map(variants.map((v) => [v.id, v]));
  const productById = new Map(products.map((p) => [p.id, p]));

  // Live from Merchize, not stored — a handful of orders at a time, and it's
  // the only way to show real fulfilment progress instead of just our own
  // coarse "Paid" → "Fulfilled" status. Never let one order's lookup
  // failure break the rest of the page.
  const progressByOrder = new Map<string, MerchizeProgressStep[]>();
  await Promise.all(
    (orders ?? [])
      .filter((o) => o.status === "paid" || o.status === "fulfilled")
      .map(async (order) => {
        try {
          const progress = await getMerchizeOrderProgress(order.id);
          if (progress?.order_progress) progressByOrder.set(order.id, progress.order_progress);
        } catch {
          // No progress data yet (or Merchize is unreachable) — the page
          // just falls back to showing the plain status badge for this order.
        }
      })
  );

  const itemsByOrder = new Map<string, OrderItemRow[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return (
    <>
      <PageHeader eyebrow="Your account" title="Your orders" />
      <div className="container">
        {!orders || orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Anything you buy from the shop shows up here."
            action={<LinkButton href="/shop">Browse the shop</LinkButton>}
          />
        ) : (
          <OrderList
            orders={orders}
            itemsByOrder={itemsByOrder}
            variantById={variantById}
            productById={productById}
            progressByOrder={progressByOrder}
          />
        )}
      </div>
    </>
  );
}
