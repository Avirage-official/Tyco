"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { NewBadge } from "@/components/ui/NewBadge";
import { IconArrowRight } from "@/components/icons";
import { useStaggerReveal } from "@/lib/motion/useScrollReveal";
import { formatPrice, isNew } from "@/lib/format";
import styles from "./FeaturedShop.module.css";

export type ShopItem = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  images: string[];
  category: string | null;
  published_at: string | null;
};

const CYCLE_MS = 2800;
const STAGGER_MS = 700;

/** Cycles through a card's photos on a timer, each card phase-offset so the row never swaps in unison. */
function useImageCycle(count: number, offsetMs: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => setIndex((i) => (i + 1) % count), CYCLE_MS);
    }, offsetMs);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [count, offsetMs]);

  return index;
}

export function ShopCard({ item, position }: { item: ShopItem; position: number }) {
  const activeImage = useImageCycle(item.images.length, position * STAGGER_MS);

  return (
    <Link href={`/shop/${item.id}`} className={styles.card}>
      <span className={styles.cover} aria-hidden>
        {item.images.length > 0 ? (
          item.images.map((url, i) => (
            <span
              key={url}
              className={styles.coverImg}
              data-active={i === activeImage}
              style={{ backgroundImage: `url(${url})` }}
            />
          ))
        ) : (
          <span className={styles.coverImg} data-active="true" />
        )}
        <span className={styles.halftone} aria-hidden />
      </span>
      <span className={styles.body}>
        <span className={styles.nameRow}>
          <span className={styles.name}>{item.name}</span>
          {isNew(item.published_at) && <NewBadge />}
        </span>
        {item.category && <span className={styles.category}>{item.category}</span>}
        <span className={styles.price}>{formatPrice(item.price_cents, item.currency)}</span>
      </span>
    </Link>
  );
}

export function FeaturedShop({ items }: { items: ShopItem[] }) {
  const revealRef = useStaggerReveal<HTMLDivElement>();
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (items.length === 0) return null;

  function scrollByCard(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(`.${styles.card}`);
    const amount = (card?.offsetWidth ?? 260) + 16;
    track.scrollBy({ left: amount * direction, behavior: "smooth" });
  }

  return (
    <section className={`container ${styles.wrap}`} aria-label="Shop">
      <div className={styles.head}>
        <div>
          <p className="eyebrow">The rack</p>
          <h2 className={styles.heading}>Wear the collective</h2>
        </div>
        <LinkButton href="/shop" variant="ghost" className={styles.headCta}>
          Shop all
        </LinkButton>
      </div>

      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowLeft}`}
          onClick={() => scrollByCard(-1)}
          aria-label="Scroll to previous items"
        >
          <IconArrowRight />
        </button>

        <div
          ref={(el) => {
            trackRef.current = el;
            revealRef.current = el;
          }}
          className={styles.track}
        >
          {items.map((item, i) => (
            <ShopCard key={item.id} item={item} position={i} />
          ))}
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => scrollByCard(1)}
          aria-label="Scroll to next items"
        >
          <IconArrowRight />
        </button>
      </div>
    </section>
  );
}
