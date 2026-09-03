"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { startDealCheckout } from "./actions";
import styles from "../studio.module.css";

export function DealRedeem({
  dealId,
  memberPriceCents,
  currency,
  capRemaining,
  signedIn,
}: {
  dealId: string;
  memberPriceCents: number;
  currency: string;
  capRemaining: number | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = capRemaining !== null && capRemaining <= 0;

  async function handleRedeem() {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await startDealCheckout(dealId, agreed);
      router.push(checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  if (!signedIn) {
    return (
      <Link href="/login?next=/studio/deals" className={styles.ticketCta}>
        Sign in to redeem
      </Link>
    );
  }

  if (soldOut) {
    return <span className={styles.soldOut}>Fully claimed this month</span>;
  }

  return (
    <div className={styles.ticketPurchase}>
      <label className={styles.ticketPolicy}>
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>
          I agree to the{" "}
          <Link
            href="/terms#deals"
            target="_blank"
            className={styles.ticketPolicyLink}
            onClick={(e) => e.stopPropagation()}
          >
            deal terms
          </Link>{" "}
          — this redemption is final and non-refundable.
        </span>
      </label>
      <button type="button" className={styles.ticketCta} onClick={handleRedeem} disabled={loading || !agreed}>
        {loading ? "Redirecting…" : `Redeem — ${formatPrice(memberPriceCents, currency)}`}
      </button>
      {error && <p className={styles.ticketError}>{error}</p>}
    </div>
  );
}
