"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatDate, formatEventDateTime, formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { resumeTicketCheckout } from "./actions";
import styles from "./tickets.module.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

type EventRow = {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
  cover_url: string | null;
};
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
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (redirectUrl) window.location.href = redirectUrl;
  }, [redirectUrl]);

  async function handleResume(ticketId: string) {
    setResumingId(ticketId);
    setErrorId(null);
    setError(null);
    try {
      const { checkoutUrl } = await resumeTicketCheckout(ticketId);
      setRedirectUrl(checkoutUrl);
    } catch (err) {
      setErrorId(ticketId);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setResumingId(null);
    }
  }

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
            {event?.cover_url && (
              <div
                className={styles.cover}
                style={{ backgroundImage: `url(${event.cover_url})` }}
                aria-hidden
              />
            )}
            <div className={styles.body}>
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

              {ticket.status === "pending" && justPurchased && (
                <p className={styles.confirming}>
                  We&rsquo;re confirming your payment — refresh this page in a moment if it doesn&rsquo;t
                  update.
                </p>
              )}

              {ticket.status === "pending" && !justPurchased && (
                <div className={styles.resume}>
                  <Button
                    variant="ghost"
                    onClick={() => handleResume(ticket.id)}
                    disabled={resumingId === ticket.id}
                  >
                    {resumingId === ticket.id ? "Redirecting…" : "Complete payment"}
                  </Button>
                  {errorId === ticket.id && <p className={styles.error}>{error}</p>}
                </div>
              )}

              {ticket.checked_in_at && (
                <p className={styles.checkedIn}>Checked in {formatDate(ticket.checked_in_at)}</p>
              )}

              <div className={styles.cardFooter}>
                <span>Total</span>
                <span className={styles.total}>{formatPrice(ticket.total_cents, ticket.currency)}</span>
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
