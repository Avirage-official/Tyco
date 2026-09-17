"use client";

import { MotionLink } from "@/lib/motion/MotionLink";
import { fadeUpItem } from "@/lib/motion/variants";
import styles from "./Card.module.css";

export type CardRatio = "4/3" | "3/4" | "1/1" | "16/9";

/**
 * The single card anatomy: media on top at a fixed ratio, body below on
 * `--surface`. The whole card is one link. Put a `CoverImage` (or any
 * fill-positioned media) in `media`; put text in `children`. Cards inside
 * a `motion` container carrying `fadeUpContainer` stagger in on their own.
 */
export function Card({
  href,
  media,
  ratio = "4/3",
  badge,
  children,
  className,
  ariaLabel,
}: {
  href: string;
  media: React.ReactNode;
  ratio?: CardRatio;
  /** Rendered in the top-left corner of the media. */
  badge?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <MotionLink
      href={href}
      className={className ? `${styles.card} ${className}` : styles.card}
      variants={fadeUpItem}
      aria-label={ariaLabel}
    >
      <span className={styles.media} style={{ aspectRatio: ratio }}>
        {media}
        {badge && <span className={styles.badge}>{badge}</span>}
      </span>
      <span className={styles.body}>{children}</span>
    </MotionLink>
  );
}

/** Title / meta / price helpers so card bodies stay consistent. */
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <span className={styles.title}>{children}</span>;
}

export function CardMeta({ children }: { children: React.ReactNode }) {
  return <span className={styles.meta}>{children}</span>;
}

export function CardPrice({ children, original }: { children: React.ReactNode; original?: React.ReactNode }) {
  return (
    <span className={styles.priceRow}>
      <span className={styles.price}>{children}</span>
      {original && <s className={styles.priceOriginal}>{original}</s>}
    </span>
  );
}
