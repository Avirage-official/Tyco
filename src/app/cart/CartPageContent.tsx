"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button, LinkButton } from "@/components/ui/Button";
import { useCart } from "@/lib/cart/CartContext";
import { formatPrice } from "@/lib/format";
import { COUNTRIES } from "@/lib/shipping/countries";
import { startCheckout, type ShippingDetails } from "./actions";
import styles from "./cart.module.css";

const EMPTY_SHIPPING: ShippingDetails = {
  firstName: "",
  lastName: "",
  address1: "",
  address2: "",
  city: "",
  region: "",
  postcode: "",
  countryCode: "",
  phone: "",
};

const SHIPPING_FIELDS: {
  key: keyof ShippingDetails;
  label: string;
  placeholder?: string;
  full?: boolean;
  type?: "text" | "country";
}[] = [
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "address1", label: "Address", full: true },
  { key: "address2", label: "Apartment, suite, etc. (optional)", full: true },
  { key: "city", label: "City" },
  { key: "region", label: "State / Region" },
  { key: "postcode", label: "Postcode" },
  { key: "countryCode", label: "Country", type: "country" },
  { key: "phone", label: "Phone", full: true },
];

export function CartPageContent({ signedIn }: { signedIn: boolean }) {
  const { items, setQuantity, removeItem, subtotalCents } = useCart();
  const [shipping, setShipping] = useState<ShippingDetails>(EMPTY_SHIPPING);
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

  function updateShipping(key: keyof ShippingDetails, value: string) {
    setShipping((prev) => ({ ...prev, [key]: value }));
  }

  async function handleCheckout() {
    setCheckingOut(true);
    setError(null);
    try {
      const { checkoutUrl } = await startCheckout(
        items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
        shipping
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

        {signedIn ? (
          <>
            <p className={styles.sectionLabel}>Shipping</p>
            <div className={styles.fieldGrid}>
              {SHIPPING_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className={styles.field}
                  style={field.full ? { gridColumn: "1 / -1" } : undefined}
                >
                  <label className={styles.fieldLabel} htmlFor={`ship-${field.key}`}>
                    {field.label}
                  </label>
                  {field.type === "country" ? (
                    <select
                      id={`ship-${field.key}`}
                      className={styles.fieldInput}
                      value={shipping.countryCode}
                      onChange={(e) => updateShipping("countryCode", e.target.value)}
                    >
                      <option value="">Select a country</option>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`ship-${field.key}`}
                      className={styles.fieldInput}
                      placeholder={field.placeholder}
                      value={shipping[field.key] ?? ""}
                      onChange={(e) => updateShipping(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <Button onClick={handleCheckout} disabled={checkingOut} full>
              {checkingOut ? "Redirecting…" : "Checkout"}
            </Button>
            <p className={styles.terms}>
              By placing this order you agree to our{" "}
              <Link href="/terms#shop" target="_blank" className={styles.termsLink}>
                Terms &amp; Conditions
              </Link>
              .
            </p>
          </>
        ) : (
          <div className={styles.signInPrompt}>
            <p className={styles.signInText}>
              Sign in to check out — it&rsquo;s how you track this order and see your tickets afterward.
            </p>
            <LinkButton href="/login?next=/cart" full>
              Sign in to check out
            </LinkButton>
            <p className={styles.signInSwitch}>
              New here? <Link href="/signup?next=/cart">Create an account</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
