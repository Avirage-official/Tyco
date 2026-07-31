"use client";

import { useEffect } from "react";
import { LinkButton } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/format";
import styles from "./confirmation.module.css";

type Order = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  customer_email: string | null;
};

export function ConfirmationContent({ order }: { order: Order }) {
  const { clear } = useCart();

  useEffect(() => {
    // A completed checkout empties the cart regardless of whether the
    // webhook has processed yet — this only clears local cart state.
    clear();
  }, [clear]);

  return (
    <div className={`container ${styles.wrap}`}>
      <p className="eyebrow">Order placed</p>
      <h1 className={styles.title}>Thank you</h1>
      <p className={styles.desc}>
        {order.status === "paid"
          ? `Payment confirmed — a receipt is on its way to ${order.customer_email ?? "your email"}.`
          : "We're confirming your payment now — you'll get an email as soon as it clears."}
      </p>
      <p className={styles.total}>{formatPrice(order.total_cents, order.currency)}</p>
      <p className={styles.orderId}>Order #{order.id.slice(0, 8)}</p>
      <LinkButton href="/shop">Continue shopping</LinkButton>
    </div>
  );
}
