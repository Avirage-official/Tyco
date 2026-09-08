"use client";

import { motion } from "motion/react";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatDate, formatPrice } from "@/lib/format";
import type { MerchizeProgressStep } from "@/lib/checkout/merchize";
import { OrderProgressTracker } from "./OrderProgressTracker";
import styles from "./orders.module.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

type Order = { id: string; status: string; currency: string; total_cents: number; created_at: string };
type OrderItemRow = { order_id: string; variant_id: string; quantity: number; unit_price_cents: number };
type VariantRow = { id: string; size: string; product_id: string };
type ProductRow = { id: string; name: string; images: string[] };

export function OrderList({
  orders,
  itemsByOrder,
  variantById,
  productById,
  progressByOrder,
}: {
  orders: Order[];
  itemsByOrder: Map<string, OrderItemRow[]>;
  variantById: Map<string, VariantRow>;
  productById: Map<string, ProductRow>;
  progressByOrder: Map<string, MerchizeProgressStep[]>;
}) {
  return (
    <motion.ul
      className={styles.list}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {orders.map((order) => (
        <motion.li key={order.id} className={styles.card} variants={fadeUpItem}>
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
                    style={product?.images?.[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined}
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

          {progressByOrder.has(order.id) && <OrderProgressTracker steps={progressByOrder.get(order.id)!} />}
        </motion.li>
      ))}
    </motion.ul>
  );
}
