"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { StickyBar } from "@/components/ui/StickyBar";
import { useIsMobile } from "@/lib/hooks/useMediaQuery";
import { fadeUpItem } from "@/lib/motion/variants";
import { formatPrice } from "@/lib/format";
import { capacityLabel, priceLabel } from "../EventCard";
import { startTicketCheckout } from "../actions";
import styles from "./event.module.css";

type Props = {
  eventId: string;
  title: string;
  dateLine: string;
  priceCents: number;
  currency: string;
  capacity: number | null;
  capacityRemaining: number | null;
  signedIn: boolean;
};

function Stepper({
  quantity,
  max,
  onChange,
}: {
  quantity: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className={styles.stepper}>
      <button
        type="button"
        onClick={() => onChange(quantity - 1)}
        disabled={quantity <= 1}
        aria-label="One fewer ticket"
      >
        −
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        type="button"
        onClick={() => onChange(quantity + 1)}
        disabled={quantity >= max}
        aria-label="One more ticket"
      >
        +
      </button>
    </div>
  );
}

/**
 * The ticket call-to-action: a sticky card in the side column on desktop,
 * a fixed bottom bar on mobile. "Get tickets" opens a Sheet holding the
 * summary, the terms and the agreement checkbox, so the primary button is
 * always enabled and the legal step comes second. The quantity stepper
 * lives in the card on desktop and in the sheet on mobile, where the bar
 * has no room for it — never both at once.
 */
export function TicketPanel(props: Props) {
  const { eventId, priceCents, currency, capacity, capacityRemaining, signedIn } = props;
  const router = useRouter();
  const isMobile = useIsMobile();
  const [quantity, setQuantity] = useState(1);
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soldOut = capacity != null && (capacityRemaining ?? 0) <= 0;
  const availability = capacityLabel(capacity, capacityRemaining);
  const maxQuantity = Math.max(1, capacityRemaining ?? 99);
  const free = priceCents === 0;
  const total = formatPrice(priceCents * quantity, currency);
  const nextPath = `/happenings/${eventId}`;

  function setSafeQuantity(next: number) {
    setQuantity(Math.min(maxQuantity, Math.max(1, next)));
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const { checkoutUrl } = await startTicketCheckout(eventId, quantity, agreed);
      router.push(checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const priceBlock = (
    <div className={styles.priceBlock}>
      <span className={styles.price}>{priceLabel(priceCents, currency)}</span>
      {!free && <span className={styles.priceUnit}>per person</span>}
    </div>
  );

  const cta = (
    <Button onClick={() => setOpen(true)} disabled={soldOut} full>
      {soldOut ? "Sold out" : free ? "Get free ticket" : "Get tickets"}
    </Button>
  );

  return (
    <>
      <motion.div className={styles.card} variants={fadeUpItem} initial="hidden" animate="visible">
        {availability && <Badge tone={availability.tone}>{availability.text}</Badge>}
        {priceBlock}
        {!soldOut && (
          <div className={styles.cardRow}>
            <span className={styles.cardRowLabel}>Tickets</span>
            <Stepper quantity={quantity} max={maxQuantity} onChange={setSafeQuantity} />
          </div>
        )}
        {cta}
        {!soldOut && (
          <p className={styles.cardNote}>
            {free
              ? "Free entry. Your name goes on the door list."
              : "Pay now and your ticket is waiting under Your tickets."}
          </p>
        )}
      </motion.div>

      <div className={styles.barOnly}>
        <StickyBar>
          <div className={styles.barPrice}>
            {priceBlock}
            {availability && <span className={styles.barAvailability}>{availability.text}</span>}
          </div>
          <div className={styles.barAction}>{cta}</div>
        </StickyBar>
      </div>

      {signedIn ? (
        <Sheet
          open={open}
          onClose={() => setOpen(false)}
          title="Confirm your tickets"
          footer={
            <Button onClick={handleConfirm} disabled={!agreed || loading} full>
              {loading ? "Redirecting…" : free ? "Confirm free ticket" : `Confirm and pay ${total}`}
            </Button>
          }
        >
          <div className={styles.sheetSummary}>
            <p className={styles.sheetTitle}>{props.title}</p>
            <p className={styles.sheetMeta}>{props.dateLine}</p>
            <div className={styles.sheetPriceRow}>
              {isMobile ? (
                <Stepper quantity={quantity} max={maxQuantity} onChange={setSafeQuantity} />
              ) : (
                <span className={styles.sheetQuantity}>
                  {quantity} {quantity === 1 ? "ticket" : "tickets"}
                </span>
              )}
              <span className={styles.sheetTotal}>{free ? "Free" : total}</span>
            </div>
          </div>

          <ul className={styles.sheetTerms}>
            <li>This purchase is final. Refunds are only given if the organisers approve one.</li>
            <li>Your ticket is tied to this account — that&rsquo;s how you&rsquo;re checked in at the door.</li>
            {!free && <li>A small payment-processing fee is added at checkout.</li>}
          </ul>

          <label className={styles.agree}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            <span>
              I agree to the{" "}
              <Link href="/terms#tickets" target="_blank" className={styles.inlineLink}>
                ticket terms
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
        <Sheet open={open} onClose={() => setOpen(false)} title="Sign in to get tickets">
          <p className={styles.sheetLead}>
            Tickets are tied to your account so staff can find you at the door. Sign in or create a free
            account to continue.
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
