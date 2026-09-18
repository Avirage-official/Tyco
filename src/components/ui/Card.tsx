"use client";

import { MotionLink } from "@/lib/motion/MotionLink";
import { fadeUpItem } from "@/lib/motion/variants";
import styles from "./Card.module.css";

export type CardRatio = "3/4" | "4/3" | "1/1" | "16/9";

/**
 * The single card anatomy: the photograph *is* the card. Text sits on the
 * image rather than in a panel below it, which is how every image-led
 * product does this — a filled box around a photo is the thing that reads
 * as a component library rather than a designed page.
 *
 * One radius, on the card, with nothing nested inside it. No chips, and no
 * button per card: the whole card is the link, so a grid stays scannable
 * and there is nothing to mis-tap.
 *
 * Cards inside a `motion` container carrying `fadeUpContainer` stagger in
 * on their own.
 */
export function Card({
  href,
  media,
  ratio = "3/4",
  badge,
  kicker,
  title,
  meta,
  price,
  priceWas,
  muted = false,
  className,
  ariaLabel,
}: {
  href: string;
  media: React.ReactNode;
  ratio?: CardRatio;
  /** One small tag, top-left: availability, status. Never a row of them. */
  badge?: React.ReactNode;
  /** The line above the title — a vendor, or a date. */
  kicker?: string;
  title: string;
  /** Category, venue, location. */
  meta?: string;
  price?: string;
  /** Struck through beside the price, where there is a saving to show. */
  priceWas?: string | null;
  /** Past events and spent passes: dimmed, and still. */
  muted?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MotionLink
      href={href}
      className={[styles.card, muted ? styles.muted : "", className ?? ""].filter(Boolean).join(" ")}
      style={{ aspectRatio: ratio }}
      variants={fadeUpItem}
      aria-label={ariaLabel}
    >
      <span className={styles.media}>{media}</span>
      <span className={styles.scrim} aria-hidden />
      {badge && <span className={styles.badge}>{badge}</span>}

      <span className={styles.body}>
        {kicker && <span className={styles.kicker}>{kicker}</span>}
        <span className={styles.title}>{title}</span>
        {meta && <span className={styles.meta}>{meta}</span>}
        {price && (
          <span className={styles.priceRow}>
            <span className={styles.price}>{price}</span>
            {priceWas && <s className={styles.priceWas}>{priceWas}</s>}
          </span>
        )}
      </span>
    </MotionLink>
  );
}
