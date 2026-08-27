import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { SwipeDashboard } from "@/components/home/SwipeDashboard";
import { getSwipeDashboardData } from "@/lib/home/swipe-data";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatEventDateParts, formatPrice } from "@/lib/format";
import { EventHero } from "./EventHero";
import { TicketPurchase } from "./TicketPurchase";
import styles from "./studio.module.css";

export const metadata: Metadata = { title: "Events" };

export default async function StudioEventsPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { data: past }, { data: userData }, swipeData] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, title, location, organizer, event_date, cover_url, cover_video_url, price_cents, currency, capacity, capacity_remaining"
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
    getSwipeDashboardData(supabase),
  ]);

  const signedIn = Boolean(userData.user);

  const [featured, ...restUpcoming] = upcoming ?? [];
  const hasPast = past && past.length > 0;

  if (!featured && !hasPast) {
    return (
      <>
        <SwipeDashboard {...swipeData} initialSlide={1} />
        <EmptyState
          title="No events on the calendar yet"
          description="Past shows and upcoming dates published from Supabase will be listed here, soonest first."
        />
      </>
    );
  }

  return (
    <div>
      {featured && <EventHero event={featured} signedIn={signedIn} />}

      <SwipeDashboard {...swipeData} initialSlide={1} />

      {restUpcoming.length > 0 && (
        <section style={{ marginTop: "var(--space-2xl)" }}>
          <h2 className={styles.sectionTitle}>More dates</h2>
          <div className={styles.gigList}>
            {restUpcoming.map((event) => {
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
        <section style={{ marginTop: "var(--space-2xl)" }}>
          <h2 className={styles.sectionTitle}>Past events</h2>
          <div className={styles.filmstrip}>
            {past.map((event, i) => (
              <div key={event.id} className={styles.filmCard}>
                <div
                  className={styles.filmMedia}
                  style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
                >
                  <span className={styles.filmIndex}>{String(i + 1).padStart(2, "0")}</span>
                  <div className={styles.filmBody}>
                    <p className={styles.filmDate}>{formatDate(event.event_date)}</p>
                    <h3 className={styles.filmTitle}>{event.title}</h3>
                    {event.location && <p className={styles.filmLocation}>{event.location}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
