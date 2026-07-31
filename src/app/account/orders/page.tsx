import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import styles from "./orders.module.css";

export const metadata: Metadata = { title: "Your orders" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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
          <ul className={styles.list}>
            {orders.map((order) => (
              <li key={order.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <p className={styles.orderId}>Order #{order.id.slice(0, 8)}</p>
                    <p className={styles.orderDate}>{formatDate(order.created_at)}</p>
                  </div>
                  <span className={`${styles.status} ${styles[`status_${order.status}`] ?? ""}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>

                <ul className={styles.itemList}>
                  {(itemsByOrder.get(order.id) ?? []).map((item, i) => {
                    const variant = variantById.get(item.variant_id);
                    const product = variant ? productById.get(variant.product_id) : undefined;
                    return (
                      <li key={i} className={styles.item}>
                        <div
                          className={styles.itemCover}
                          style={
                            product?.images?.[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined
                          }
                          aria-hidden
                        />
                        <div className={styles.itemMeta}>
                          <span className={styles.itemName}>{product?.name ?? "Item no longer available"}</span>
                          {variant && <span className={styles.itemSize}>Size {variant.size}</span>}
                        </div>
                        <span className={styles.itemQty}>×{item.quantity}</span>
                        <span className={styles.itemPrice}>
                          {formatPrice(item.unit_price_cents * item.quantity, order.currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <div className={styles.cardFooter}>
                  <span>Total</span>
                  <span className={styles.total}>{formatPrice(order.total_cents, order.currency)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
