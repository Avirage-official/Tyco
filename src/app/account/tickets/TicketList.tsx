"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pass, PassCode } from "@/components/account/Pass";
import { HandoverPanel } from "@/components/account/HandoverPanel";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatEventDateTime, formatPrice } from "@/lib/format";
import { DENIAL_REASONS, REVERSAL_REASONS } from "@/lib/tickets/doorReasons";
import { approveTicketCheckIn, denyTicketCheckIn, reverseTicketDenial, resumeTicketCheckout } from "./actions";
import styles from "./tickets.module.css";

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
  checked_in_by_name: string | null;
  denied_at: string | null;
  denied_by_name: string | null;
  denied_reasons: string[] | null;
  reversed_at: string | null;
  reversed_by_name: string | null;
  reversed_reasons: string[] | null;
  created_at: string;
  event_id: string;
};

export function TicketList({
  tickets,
  eventById,
  holderName,
  justPurchasedId,
}: {
  tickets: Ticket[];
  eventById: Map<string, EventRow>;
  holderName: string;
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
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        const title = event?.title ?? "Event";
        const meta = event
          ? [formatEventDateTime(event.event_date), event.location].filter(Boolean).join(" · ")
          : undefined;

        return (
          <motion.li key={ticket.id} variants={fadeUpItem}>
            <Pass
              coverUrl={event?.cover_url ?? null}
              coverAlt={title}
              title={title}
              meta={meta}
              holderName={holderName}
              highlight={ticket.id === justPurchasedId}
              status={
                ticket.status !== "paid" ? (
                  <span className={styles.statusSlot}>
                    <Badge tone={ticket.status === "pending" ? "warning" : "neutral"}>
                      {ticket.status === "pending" ? "Payment pending" : ticket.status}
                    </Badge>
                  </span>
                ) : null
              }
              footer={
                <>
                  <PassCode code={ticket.reference_code} />
                  <span>
                    {ticket.quantity} {ticket.quantity === 1 ? "person" : "people"} ·{" "}
                    {formatPrice(ticket.total_cents, ticket.currency)}
                  </span>
                </>
              }
            >
              {ticket.status === "paid" && (
                <HandoverPanel
                  noun="ticket"
                  actionLabel="Check in"
                  approvedLabel="Checked in"
                  declineReasons={DENIAL_REASONS}
                  reversalReasons={REVERSAL_REASONS}
                  decision={{
                    approvedAt: ticket.checked_in_at,
                    approvedByName: ticket.checked_in_by_name,
                    declinedAt: ticket.denied_at,
                    declinedByName: ticket.denied_by_name,
                    declinedReasons: ticket.denied_reasons,
                    reversedAt: ticket.reversed_at,
                    reversedByName: ticket.reversed_by_name,
                    reversedReasons: ticket.reversed_reasons,
                  }}
                  onApprove={async (staffName) => {
                    const t = await approveTicketCheckIn(ticket.id, staffName);
                    return toDecision(t);
                  }}
                  onDecline={async (staffName, reasons) => {
                    const t = await denyTicketCheckIn(ticket.id, staffName, reasons);
                    return toDecision(t);
                  }}
                  onReverse={async (staffName, reasons) => {
                    const t = await reverseTicketDenial(ticket.id, staffName, reasons);
                    return toDecision(t);
                  }}
                />
              )}

              {ticket.status === "pending" && ticket.id === justPurchasedId && (
                <p className={styles.confirming}>
                  We&rsquo;re confirming your payment — refresh this page in a moment if it
                  doesn&rsquo;t update.
                </p>
              )}

              {ticket.status === "pending" && ticket.id !== justPurchasedId && (
                <div className={styles.resume}>
                  <Button
                    variant="ghost"
                    full
                    onClick={() => handleResume(ticket.id)}
                    disabled={resumingId === ticket.id}
                  >
                    {resumingId === ticket.id ? "Redirecting…" : "Complete payment"}
                  </Button>
                  {errorId === ticket.id && <p className={styles.error}>{error}</p>}
                </div>
              )}
            </Pass>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

type TicketDecisionFields = {
  checked_in_at: string | null;
  checked_in_by_name: string | null;
  denied_at: string | null;
  denied_by_name: string | null;
  denied_reasons: string[] | null;
  reversed_at: string | null;
  reversed_by_name: string | null;
  reversed_reasons: string[] | null;
};

/** The door columns are named for a door; the shared panel isn't. */
function toDecision(ticket: TicketDecisionFields) {
  return {
    approvedAt: ticket.checked_in_at,
    approvedByName: ticket.checked_in_by_name,
    declinedAt: ticket.denied_at,
    declinedByName: ticket.denied_by_name,
    declinedReasons: ticket.denied_reasons,
    reversedAt: ticket.reversed_at,
    reversedByName: ticket.reversed_by_name,
    reversedReasons: ticket.reversed_reasons,
  };
}
