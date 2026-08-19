import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEventDateTime, formatPrice } from "@/lib/format";
import styles from "./tickets.module.css";

export const metadata: Metadata = { title: "Your tickets" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket?: string }>;
}) {
  const { ticket: justPurchasedId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/tickets");
  }

  const { data: tickets } = await supabase
    .from("event_tickets")
    .select(
      "id, quantity, total_cents, currency, status, reference_code, checked_in_at, created_at, event_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const eventIds = Array.from(new Set((tickets ?? []).map((t) => t.event_id)));
  type EventRow = { id: string; title: string; location: string | null; event_date: string };
  let events: EventRow[] = [];
  if (eventIds.length > 0) {
    const { data } = await supabase
      .from("events")
      .select("id, title, location, event_date")
      .in("id", eventIds);
    events = data ?? [];
  }
  const eventById = new Map(events.map((e) => [e.id, e]));

  return (
    <>
      <PageHeader eyebrow="Your account" title="Your tickets" />
      <div className="container">
        {!tickets || tickets.length === 0 ? (
          <EmptyState
            title="No tickets yet"
            description="Tickets you buy for upcoming events show up here — this is what you show at the door."
            action={<LinkButton href="/studio">See what&rsquo;s on</LinkButton>}
          />
        ) : (
          <ul className={styles.list}>
            {tickets.map((ticket) => {
              const event = eventById.get(ticket.event_id);
              const justPurchased = ticket.id === justPurchasedId;
              return (
                <li
                  key={ticket.id}
                  className={justPurchased ? `${styles.card} ${styles.cardHighlight}` : styles.card}
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
                    <div className={styles.proof}>
                      <div>
                        <p className={styles.proofLabel}>Show this at the door</p>
                        <p className={styles.referenceCode}>{ticket.reference_code}</p>
                      </div>
                      <div className={styles.pax}>
                        <span className={styles.paxCount}>{ticket.quantity}</span>
                        <span className={styles.paxLabel}>{ticket.quantity === 1 ? "pax" : "pax"}</span>
                      </div>
                    </div>
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
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
