"use client";

import { motion } from "motion/react";
import { fadeUpContainer, revealViewport } from "@/lib/motion/variants";
import type { EventSummary } from "@/lib/events/catalog";
import { EventCard } from "./EventCard";
import styles from "./happenings.module.css";

/** A responsive grid of event posters that staggers in as it scrolls into view. */
export function EventCardRow({ events, muted = false }: { events: EventSummary[]; muted?: boolean }) {
  return (
    <motion.div
      className={styles.posterGrid}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {events.map((event) => (
        <EventCard key={event.id} event={event} muted={muted} />
      ))}
    </motion.div>
  );
}
