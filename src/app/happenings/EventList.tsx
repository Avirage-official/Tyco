"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { CoverImage } from "@/components/ui/CoverImage";
import { MotionLink } from "@/lib/motion/MotionLink";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import type { EventSummary } from "@/lib/events/catalog";
import { formatEventDateParts } from "@/lib/format";
import { capacityLabel, priceLabel } from "./EventCard";
import styles from "./happenings.module.css";

/**
 * The upcoming list: one row per date, the way a gig listing reads. The
 * date block is set large on the left so the list can be scanned by date
 * alone; the poster is a small thumbnail rather than the main event.
 */
export function EventList({ events }: { events: EventSummary[] }) {
  return (
    <motion.ul
      className={styles.list}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {events.map((event) => {
        const { month, day, weekday, time } = formatEventDateParts(event.eventDate);
        const capacity = capacityLabel(event.capacity, event.capacityRemaining);

        return (
          <li key={event.id}>
            <MotionLink href={`/happenings/${event.id}`} className={styles.row} variants={fadeUpItem}>
              <span className={styles.rowDate}>
                <span className={styles.rowDay}>{day}</span>
                <span className={styles.rowMonth}>{month}</span>
                <span className={styles.rowWeekday}>{weekday}</span>
              </span>

              <span className={styles.rowPoster}>
                <CoverImage src={event.coverUrl} alt={event.title} sizes="120px" />
              </span>

              <span className={styles.rowBody}>
                <span className={styles.rowTitle}>{event.title}</span>
                <span className={styles.rowMeta}>
                  {[time, event.location].filter(Boolean).join(" · ")}
                </span>
              </span>

              <span className={styles.rowEnd}>
                <span className={styles.rowPrice}>{priceLabel(event.priceCents, event.currency)}</span>
                {capacity && <Badge tone={capacity.tone}>{capacity.text}</Badge>}
              </span>
            </MotionLink>
          </li>
        );
      })}
    </motion.ul>
  );
}
