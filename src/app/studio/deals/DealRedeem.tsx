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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = capRemaining !== null && capRemaining <= 0;

  async function handleRedeem() {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await startDealCheckout(dealId);
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
    <div>
      <button type="button" className={styles.ticketCta} onClick={handleRedeem} disabled={loading}>
        {loading ? "Redirecting…" : `Redeem — ${formatPrice(memberPriceCents, currency)}`}
      </button>
      {error && <p className={styles.ticketError}>{error}</p>}
    </div>
  );
}
