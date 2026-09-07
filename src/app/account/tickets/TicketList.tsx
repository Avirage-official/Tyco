"use client";

import { motion } from "motion/react";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatDate, formatEventDateTime, formatPrice } from "@/lib/format";
import styles from "./tickets.module.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

type EventRow = { id: string; title: string; location: string | null; event_date: string };
type Ticket = {
  id: string;
  quantity: number;
  total_cents: number;
  currency: string;
  status: string;
  reference_code: string;
  checked_in_at: string | null;
  created_at: string;
  event_id: string;
};

export function TicketList({
  tickets,
  eventById,
  justPurchasedId,
}: {
  tickets: Ticket[];
  eventById: Map<string, EventRow>;
  justPurchasedId?: string;
}) {
  return (
    <motion.ul
      className={styles.list}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {tickets.map((ticket) => {
        const event = eventById.get(ticket.event_id);
        const justPurchased = ticket.id === justPurchasedId;
        return (
          <motion.li
            key={ticket.id}
            className={justPurchased ? `${styles.card} ${styles.cardHighlight}` : styles.card}
            variants={fadeUpItem}
          >
            <div className={styles.cardHeader}>
              <div>
                <p className={styles.eventTitle}>{event?.title ?? "Event"}</p>
                {event && (
                  <p className={styles.eventMeta}>
                    {[formatEventDateTime(event.event_date), event.location].filter(Boolean).join(" — ")}
                  </p>
                )}
              </div>
              <span className={`${styles.status} ${styles[`status_${ticket.status}`] ?? ""}`}>
                {STATUS_LABEL[ticket.status] ?? ticket.status}
              </span>
            </div>

            {ticket.status === "paid" && (
              <>
                <div className={styles.tear} aria-hidden />
                <div className={styles.proof}>
                  <div>
                    <p className={styles.proofLabel}>Show this at the door</p>
                    <p className={styles.referenceCode}>{ticket.reference_code}</p>
                  </div>
                  <div className={styles.pax}>
                    <span className={styles.paxCount}>{ticket.quantity}</span>
                    <span className={styles.paxLabel}>pax</span>
                  </div>
                </div>
              </>
            )}

            {justPurchased && ticket.status === "pending" && (
              <p className={styles.confirming}>
                We&rsquo;re confirming your payment — refresh this page in a moment if it doesn&rsquo;t
                update.
              </p>
            )}

            {ticket.checked_in_at && (
              <p className={styles.checkedIn}>Checked in {formatDate(ticket.checked_in_at)}</p>
            )}

            <div className={styles.cardFooter}>
              <span>Total</span>
              <span className={styles.total}>{formatPrice(ticket.total_cents, ticket.currency)}</span>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
