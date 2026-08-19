"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { startTicketCheckout } from "./actions";
import styles from "../studio.module.css";

export function TicketPurchase({
  eventId,
  priceCents,
  currency,
  capacityRemaining,
  signedIn,
}: {
  eventId: string;
  priceCents: number;
  currency: string;
  capacityRemaining: number | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = capacityRemaining !== null && capacityRemaining <= 0;
  const maxQuantity = capacityRemaining ?? 99;

  async function handleBuy() {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await startTicketCheckout(eventId, quantity);
      router.push(checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <Link href={`/login?next=/studio/events`} className={styles.ticketCta}>
        Sign in to get tickets
      </Link>
    );
  }

  if (soldOut) {
    return <span className={styles.soldOut}>Sold out</span>;
  }

  return (
    <div className={styles.ticketPurchase}>
      <div className={styles.qtyStepper}>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          disabled={quantity <= 1}
          aria-label="Fewer pax"
        >
          −
        </button>
        <span>{quantity}</span>
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
          disabled={quantity >= maxQuantity}
          aria-label="More pax"
        >
          +
        </button>
      </div>
      <button type="button" className={styles.ticketCta} onClick={handleBuy} disabled={loading}>
        {loading
          ? "Redirecting…"
          : priceCents === 0
            ? "Get free ticket"
            : `Get tickets — ${formatPrice(priceCents * quantity, currency)}`}
      </button>
      {error && <p className={styles.ticketError}>{error}</p>}
    </div>
  );
}
