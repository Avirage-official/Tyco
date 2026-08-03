import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import styles from "../studio.module.css";

export const metadata: Metadata = { title: "Events" };

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function StudioEventsPage() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { data: past }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, location, event_date")
      .eq("is_published", true)
      .gte("event_date", nowIso)
      .order("event_date", { ascending: true }),
    supabase
      .from("events")
      .select("id, title, location, event_date, cover_url")
      .eq("is_published", true)
      .lt("event_date", nowIso)
      .order("event_date", { ascending: false }),
  ]);

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
          <div className={styles.eventsList}>
            {upcoming.map((event) => (
              <div key={event.id} className={styles.eventRow}>
                <div className={styles.eventMeta}>
                  <h3 className={styles.eventTitle}>{event.title}</h3>
                  {event.location && <p className={styles.eventLocation}>{event.location}</p>}
                </div>
                <span className={styles.eventDate}>{formatEventDate(event.event_date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {hasPast && (
        <section style={hasUpcoming ? { marginTop: "var(--space-2xl)" } : undefined}>
          <h2 className={styles.sectionTitle}>Past events</h2>
          <div className={styles.grid}>
            {past.map((event) => (
              <div key={event.id} className={styles.card}>
                <div
                  className={styles.cardMedia}
                  style={event.cover_url ? { backgroundImage: `url(${event.cover_url})` } : undefined}
                />
                <div className={styles.cardBody}>
                  <p className={styles.cardCategory}>{formatEventDate(event.event_date)}</p>
                  <h3 className={styles.cardTitle}>{event.title}</h3>
                  {event.location && <p className={styles.eventLocation}>{event.location}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
