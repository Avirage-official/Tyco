"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/format";
import { startCheckout } from "./actions";
import styles from "./cart.module.css";

export function CartPageContent({ accountEmail }: { accountEmail: string | null }) {
  const { items, setQuantity, removeItem, subtotalCents } = useCart();
  const [email, setEmail] = useState(accountEmail ?? "");
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Find something in the shop and it'll show up here."
        action={<LinkButton href="/shop">Browse the shop</LinkButton>}
      />
    );
  }

  async function handleCheckout() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Enter a valid email so we can send your receipt.");
      return;
    }

    setCheckingOut(true);
    setError(null);
    try {
      const { checkoutUrl } = await startCheckout(
        items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        trimmedEmail
      );
      window.location.href = checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setCheckingOut(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li key={item.variantId} className={styles.row}>
            <div
              className={styles.cover}
              style={item.coverUrl ? { backgroundImage: `url(${item.coverUrl})` } : undefined}
              aria-hidden
            />
            <div className={styles.meta}>
              <span className={styles.name}>{item.productName}</span>
              <span className={styles.size}>Size {item.size}</span>
            </div>
            <div className={styles.qtyStepper}>
              <button
                type="button"
                onClick={() => setQuantity(item.variantId, item.quantity - 1)}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <span className={styles.price}>{formatPrice(item.priceCents * item.quantity, item.currency)}</span>
            <button
              type="button"
              className={styles.remove}
              onClick={() => removeItem(item.variantId)}
              aria-label={`Remove ${item.productName}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className={styles.summary}>
        <div className={styles.subtotalRow}>
          <span>Subtotal</span>
          <span>{formatPrice(subtotalCents, items[0]?.currency ?? "usd")}</span>
        </div>

        <div className={styles.emailField}>
          <label className={styles.emailLabel} htmlFor="checkout-email">
            Email
          </label>
          <input
            id="checkout-email"
            type="email"
            className={styles.emailInput}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!!accountEmail}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button onClick={handleCheckout} disabled={checkingOut} full>
          {checkingOut ? "Redirecting…" : "Checkout"}
        </Button>
      </div>
    </div>
  );
}
