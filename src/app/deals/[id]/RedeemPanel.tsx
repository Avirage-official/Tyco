"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { StickyBar } from "@/components/ui/StickyBar";
import { fadeUpItem } from "@/lib/motion/variants";
import { formatPrice } from "@/lib/format";
import { availabilityLabel } from "../DealCard";
import { startDealCheckout } from "../actions";
import styles from "./deal.module.css";

type Props = {
  dealId: string;
  title: string;
  vendorName: string;
  memberPriceCents: number;
  originalPriceCents: number | null;
  currency: string;
  capRemaining: number;
  signedIn: boolean;
};

/**
 * The redeem call-to-action on a deal page: a sticky card in the side
 * column on desktop, a fixed bottom bar on mobile. Pressing Redeem opens
 * a Sheet with the summary, the terms, the agreement checkbox and the
 * final Confirm button — so the primary button is always enabled and the
 * legal step comes second. Signed-out visitors get a sign-in sheet.
 */
export function RedeemPanel(props: Props) {
  const { dealId, memberPriceCents, originalPriceCents, currency, capRemaining, signedIn } = props;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = capRemaining <= 0;
  const availability = availabilityLabel(capRemaining);
  const price = formatPrice(memberPriceCents, currency);
  const original = originalPriceCents != null ? formatPrice(originalPriceCents, currency) : null;
  const nextPath = `/deals/${dealId}`;

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await startDealCheckout(dealId, agreed);
      router.push(checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const priceBlock = (
    <div className={styles.priceBlock}>
      <span className={styles.price}>{price}</span>
      {original && <s className={styles.priceOriginal}>{original}</s>}
    </div>
  );

  const cta = (
    <Button onClick={() => setOpen(true)} disabled={soldOut} full>
      {soldOut ? "Fully claimed this month" : "Redeem"}
    </Button>
  );

  return (
    <>
      <motion.div className={styles.card} variants={fadeUpItem} initial="hidden" animate="visible">
        <Badge tone={availability.tone}>{availability.text}</Badge>
        {priceBlock}
        <p className={styles.cardNote}>Member price. Pay now, show your code at the counter.</p>
        {cta}
      </motion.div>

      <div className={styles.barOnly}>
        <StickyBar>
          <div className={styles.barPrice}>
            {priceBlock}
            <span className={styles.barAvailability}>{availability.text}</span>
          </div>
          <div className={styles.barAction}>{cta}</div>
        </StickyBar>
      </div>

      {signedIn ? (
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title="Confirm your redemption"
          footer={
            <Button onClick={handleConfirm} disabled={!agreed || loading} full>
              {loading ? "Redirecting…" : `Confirm and pay ${price}`}
            </Button>
          }
        >
          <div className={styles.sheetSummary}>
            <p className={styles.sheetTitle}>{props.title}</p>
            <p className={styles.sheetMeta}>{props.vendorName}</p>
            <div className={styles.sheetPriceRow}>
              {priceBlock}
              <Badge tone={availability.tone}>{availability.text}</Badge>
            </div>
          </div>

          <ul className={styles.sheetTerms}>
            <li>This redemption is final and non-refundable once paid.</li>
            <li>You&rsquo;ll get a reference code to show at {props.vendorName}. One code, one visit.</li>
            <li>A small payment-processing fee is added at checkout.</li>
          </ul>

          <label className={styles.agree}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the{" "}
              <Link href="/terms#deals" target="_blank" className={styles.inlineLink}>
                deal terms
              </Link>
              .
            </span>
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}
        </Sheet>
      ) : (
        <Sheet open={open} onClose={() => setOpen(false)} title="Sign in to redeem">
          <p className={styles.sheetLead}>
            Deals are tied to your account so the reference code can be checked at the counter. Sign in or
            create a free account to continue.
          </p>
          <div className={styles.sheetActions}>
            <LinkButton href={`/login?next=${encodeURIComponent(nextPath)}`} full>
              Log in
            </LinkButton>
            <LinkButton href={`/signup?next=${encodeURIComponent(nextPath)}`} variant="ghost" full>
              Create an account
            </LinkButton>
          </div>
        </Sheet>
      )}
    </>
  );
}
