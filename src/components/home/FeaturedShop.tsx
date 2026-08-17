"use client";

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

function ShopCard({ item, hero }: { item: ShopItem; hero?: boolean }) {
  return (
    <Link
      href={`/shop/${item.id}`}
      className={hero ? `${styles.card} ${styles.hero}` : styles.card}
    >
      {hero && <span className={styles.tape} aria-hidden />}
      <span
        className={styles.cover}
        style={item.images?.[0] ? { backgroundImage: `url(${item.images[0]})` } : undefined}
        aria-hidden
      />
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
        <ShopCard item={hero} hero />
        {rest.map((item) => (
          <ShopCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
