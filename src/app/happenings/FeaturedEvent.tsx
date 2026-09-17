"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { CoverImage } from "@/components/ui/CoverImage";
import { IconClock, IconPin } from "@/components/icons";
import { fadeUpContainer, fadeUpItem } from "@/lib/motion/variants";
import type { EventSummary } from "@/lib/events/catalog";
import { formatEventDateParts } from "@/lib/format";
import { capacityLabel, priceLabel } from "./EventCard";
import styles from "./happenings.module.css";

/**
 * The next event, given the full width of the page. The artwork is the
 * background and the copy staggers in over it once — everything a visitor
 * needs to decide (when, where, how much, is it still on) before the
 * "Get tickets" button takes them to the detail page.
 */
export function FeaturedEvent({ event }: { event: EventSummary }) {
  const { month, day, weekday, time } = formatEventDateParts(event.eventDate);
  const capacity = capacityLabel(event.capacity, event.capacityRemaining);

  return (
    <section className={styles.featured} aria-labelledby="featured-event">
      <div className={styles.featuredMedia}>
        <CoverImage src={event.coverUrl} alt={event.title} sizes="100vw" priority />
        {event.coverVideoUrl && (
          <video className={styles.featuredVideo} autoPlay muted loop playsInline aria-hidden>
            <source src={event.coverVideoUrl} type="video/mp4" />
          </video>
        )}
        <span className={styles.featuredScrim} aria-hidden />
      </div>

      <motion.div
        className={`container container--wide ${styles.featuredBody}`}
        variants={fadeUpContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.p className={styles.featuredDate} variants={fadeUpItem}>
          {weekday}, {month} {day}
        </motion.p>

        <motion.h2 id="featured-event" className={styles.featuredTitle} variants={fadeUpItem}>
          {event.title}
        </motion.h2>

        <motion.p className={styles.featuredMeta} variants={fadeUpItem}>
          <span>
            <IconClock />
            {time}
          </span>
          {event.location && (
            <span>
              <IconPin />
              {event.location}
            </span>
          )}
          {event.organizer && <span>Hosted by {event.organizer}</span>}
        </motion.p>

        <motion.div className={styles.featuredActions} variants={fadeUpItem}>
          <LinkButton href={`/happenings/${event.id}`}>Get tickets</LinkButton>
          <span className={styles.featuredPrice}>{priceLabel(event.priceCents, event.currency)}</span>
          {capacity && <Badge tone={capacity.tone}>{capacity.text}</Badge>}
        </motion.div>
      </motion.div>
    </section>
  );
}
