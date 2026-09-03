"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatEventDateParts, formatPrice } from "@/lib/format";
import { TicketPurchase } from "./TicketPurchase";
import { Waveform } from "./Waveform";
import styles from "./studio.module.css";

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  organizer: string | null;
  event_date: string;
  cover_url: string | null;
  price_cents: number;
  currency: string;
  capacity: number | null;
  capacity_remaining: number | null;
};

export function EventCard({ event, signedIn }: { event: Event; signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const { month, day, weekday, time } = formatEventDateParts(event.event_date);
  const going =
    event.capacity != null && event.capacity_remaining != null
      ? event.capacity - event.capacity_remaining
      : null;

  return (
    <>
      <button type="button" className={styles.eventCard} onClick={() => setOpen(true)}>
        <span
          className={styles.eventCardMedia}
          style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
          aria-hidden
        />
        <span className={styles.eventCardScrim} aria-hidden />

        <div className={styles.eventCardTop}>
          <span className={styles.eventCardDate}>
            {month} {day}
          </span>
          <Waveform />
        </div>

        <div className={styles.eventCardBody}>
          <h3 className={styles.eventCardTitle}>{event.title}</h3>
          <p className={styles.eventCardMeta}>
            {[weekday + " · " + time, event.location].filter(Boolean).join(" — ")}
          </p>
          <p className={styles.eventCardPrice}>
            {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free entry"}
          </p>
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div
          className={styles.modalCover}
          style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
        />
        <div className={styles.modalBody}>
          <p className={styles.eventCardDate}>
            {month} {day} · {weekday} · {time}
          </p>
          <h2 id={titleId} className={styles.modalTitle}>
            {event.title}
          </h2>
          {(event.location || event.organizer) && (
            <p className={styles.modalMeta}>
              {[event.location, event.organizer && `Hosted by ${event.organizer}`].filter(Boolean).join(" — ")}
            </p>
          )}
          {event.description && <p className={styles.modalDescription}>{event.description}</p>}
          {going !== null && <p className={styles.modalMeta}>{going} going</p>}

          <p className={styles.modalPrice} style={{ marginTop: "var(--space-md)" }}>
            {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free"}
          </p>

          <div className={styles.eventCardAction}>
            <TicketPurchase
              eventId={event.id}
              priceCents={event.price_cents}
              currency={event.currency}
              capacityRemaining={event.capacity != null ? event.capacity_remaining : null}
              signedIn={signedIn}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
