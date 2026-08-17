"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { NewBadge } from "@/components/ui/NewBadge";
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

/** Cycles through a card's photos on a timer, each card phase-offset so the grid never swaps in unison. */
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

function ShopCard({ item, hero, position }: { item: ShopItem; hero?: boolean; position: number }) {
  const activeImage = useImageCycle(item.images.length, position * STAGGER_MS);

  return (
    <Link
      href={`/shop/${item.id}`}
      className={hero ? `${styles.card} ${styles.hero}` : styles.card}
    >
      {hero && <span className={styles.tape} aria-hidden />}
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
      </span>
      <span className={styles.halftone} aria-hidden />
      <span className={styles.scrim} aria-hidden />
      <span className={styles.priceTag}>{formatPrice(item.price_cents, item.currency)}</span>
      <span className={styles.body}>
        {item.category && <span className={styles.category}>{item.category}</span>}
        <span className={styles.name}>
          {item.name} {isNew(item.published_at) && <NewBadge />}
        </span>
      </span>
    </Link>
  );
}

export function FeaturedShop({ items }: { items: ShopItem[] }) {
  const gridRef = useStaggerReveal<HTMLDivElement>();

  if (items.length === 0) return null;

  const [hero, ...rest] = items;

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

      <div ref={gridRef} className={styles.grid} data-count={items.length}>
        <ShopCard item={hero} hero position={0} />
        {rest.map((item, i) => (
          <ShopCard key={item.id} item={item} position={i + 1} />
        ))}
      </div>
    </section>
  );
}
