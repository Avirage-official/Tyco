"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardMeta, CardTitle } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import type { EventSummary } from "@/lib/events/catalog";
import { formatEventDateParts, formatPrice } from "@/lib/format";
import styles from "./happenings.module.css";

/**
 * Teal while spots remain, neutral once an event is full. Events with no
 * capacity set show nothing rather than a made-up number.
 */
export function capacityLabel(capacity: number | null, remaining: number | null) {
  if (capacity == null) return null;
  const left = remaining ?? 0;
  if (left <= 0) return { tone: "neutral" as const, text: "Sold out" };
  return { tone: "success" as const, text: `${left} spot${left === 1 ? "" : "s"} left` };
}

export function priceLabel(priceCents: number, currency: string) {
  return priceCents > 0 ? formatPrice(priceCents, currency) : "Free";
}

/**
 * A poster card for an event, at the 3:4 ratio event artwork is usually
 * made in. `muted` is the past-events treatment: no availability badge,
 * no price, dimmed artwork and no hover lift.
 */
export function EventCard({ event, muted = false }: { event: EventSummary; muted?: boolean }) {
  const { month, day, weekday } = formatEventDateParts(event.eventDate);
  const capacity = muted ? null : capacityLabel(event.capacity, event.capacityRemaining);
  const meta = [event.location, muted ? null : priceLabel(event.priceCents, event.currency)]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      href={`/happenings/${event.id}`}
      ratio="3/4"
      className={muted ? styles.mutedCard : undefined}
      media={
        <CoverImage
          src={event.coverUrl}
          alt={event.title}
          sizes="(min-width: 1000px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      }
      badge={capacity ? <Badge tone={capacity.tone}>{capacity.text}</Badge> : undefined}
    >
      <CardMeta>{muted ? `${month} ${day}` : `${weekday}, ${month} ${day}`}</CardMeta>
      <CardTitle>{event.title}</CardTitle>
      {meta && <CardMeta>{meta}</CardMeta>}
    </Card>
  );
}
