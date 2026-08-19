import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEventDateParts, formatPrice } from "@/lib/format";
import { TicketPurchase } from "./TicketPurchase";
import styles from "./studio.module.css";

export const metadata: Metadata = { title: "Events" };

export default async function StudioEventsPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { data: past }, { data: userData }] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title, location, organizer, event_date, cover_url, price_cents, currency, capacity, capacity_remaining"
      )
      .eq("is_published", true)
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, location, event_date, cover_url")
      .eq("is_published", true)
      .lt("event_date", nowIso)
      .order("event_date", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const signedIn = Boolean(userData.user);

  const hasUpcoming = upcoming && upcoming.length > 0;
  const hasPast = past && past.length > 0;

  if (!hasUpcoming && !hasPast) {
    return (
      <EmptyState
        title="No events on the calendar yet"
        description="Past shows and upcoming dates published from Supabase will be listed here, soonest first."
      />
    );
  }

  return (
    <div>
      {hasUpcoming && (
        <section>
          <h2 className={styles.sectionTitle}>Upcoming</h2>
          <div className={styles.gigList}>
            {upcoming.map((event) => {
              const { month, day, weekday, time } = formatEventDateParts(event.event_date);
              return (
                <div key={event.id} className={styles.gigRow}>
                  {event.cover_url && (
                    <span
                      className={styles.gigBg}
                      style={{ backgroundImage: `url(${event.cover_url})` }}
                      aria-hidden
                    />
                  )}
                  <span className={styles.gigScrim} aria-hidden />

                  <div className={styles.gigDate}>
                    <span className={styles.gigDateMonth}>{month}</span>
                    <span className={styles.gigDateDay}>{day}</span>
                    <span className={styles.gigDateTime}>
                      {weekday}
                      <br />
                      {time}
                    </span>
                  </div>

                  <div className={styles.gigMeta}>
                    <h3 className={styles.gigTitle}>{event.title}</h3>
                    {event.location && <p className={styles.gigLocation}>{event.location}</p>}
                    {event.organizer && <p className={styles.gigOrganizer}>Hosted by {event.organizer}</p>}
                    <p className={styles.gigPrice}>
                      {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free entry"}
                    </p>
                  </div>

                  <div className={styles.gigAction}>
                    <TicketPurchase
                      eventId={event.id}
                      priceCents={event.price_cents}
                      currency={event.currency}
                      capacityRemaining={event.capacity != null ? event.capacity_remaining : null}
                      signedIn={signedIn}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {hasPast && (
        <section style={hasUpcoming ? { marginTop: "var(--space-2xl)" } : undefined}>
          <h2 className={styles.sectionTitle}>Past events</h2>
          <div className={styles.grid}>
            {past.map((event, i) => (
              <div key={event.id} className={styles.card}>
                <div
                  className={styles.cardMedia}
                  style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
                >
                  <span className={styles.cardIndex}>{String(i + 1).padStart(2, "0")}</span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.cardCategory}>{formatDate(event.event_date)}</p>
                  <h3 className={styles.cardTitle}>{event.title}</h3>
                  {event.location && <p className={styles.cardTagline}>{event.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
