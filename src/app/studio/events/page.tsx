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
  const { data: events } = await supabase
    .from("events")
    .select("id, title, location, event_date")
    .eq("is_published", true)
    .order("event_date", { ascending: true });

  if (!events || events.length === 0) {
    return (
      <EmptyState
        title="No events on the calendar yet"
        description="Past shows and upcoming dates published from Supabase will be listed here, soonest first."
      />
    );
  }

  return (
    <div className={styles.eventsList}>
      {events.map((event) => (
        <div key={event.id} className={styles.eventRow}>
          <div className={styles.eventMeta}>
            <h3 className={styles.eventTitle}>{event.title}</h3>
            {event.location && <p className={styles.eventLocation}>{event.location}</p>}
          </div>
          <span className={styles.eventDate}>{formatEventDate(event.event_date)}</span>
        </div>
      ))}
    </div>
  );
}
