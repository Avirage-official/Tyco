import "server-only";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/** Everything an event row, hero or detail page needs. */
export type EventSummary = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  organizer: string | null;
  eventDate: string;
  coverUrl: string | null;
  coverVideoUrl: string | null;
  priceCents: number;
  currency: string;
  capacity: number | null;
  capacityRemaining: number | null;
  publishedAt: string | null;
};

export type EventCatalog = {
  /** Soonest first. */
  upcoming: EventSummary[];
  /** Most recent first. */
  past: EventSummary[];
};

const COLUMNS =
  "id, title, description, location, organizer, event_date, cover_url, cover_video_url, price_cents, currency, capacity, capacity_remaining, published_at";

/**
 * Loads every published event once and splits it around now. One call
 * serves the list page (hero, upcoming groups, past grid) and the detail
 * page (find by id, "more dates" from the rest of the upcoming list).
 */
export async function getEventCatalog(supabase: Supabase): Promise<EventCatalog> {
  const { data } = await supabase
    .from("events")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("event_date", { ascending: true });

  const now = Date.now();
  const upcoming: EventSummary[] = [];
  const past: EventSummary[] = [];

  for (const row of data ?? []) {
    const summary: EventSummary = {
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      organizer: row.organizer,
      eventDate: row.event_date,
      coverUrl: row.cover_url,
      coverVideoUrl: row.cover_video_url,
      priceCents: row.price_cents,
      currency: row.currency,
      capacity: row.capacity,
      capacityRemaining: row.capacity_remaining,
      publishedAt: row.published_at,
    };
    if (new Date(row.event_date).getTime() >= now) upcoming.push(summary);
    else past.push(summary);
  }

  // Sorted here rather than relying on the query's order, so both lists
  // read the way the page needs them regardless of what comes back.
  const at = (e: EventSummary) => new Date(e.eventDate).getTime();
  upcoming.sort((a, b) => at(a) - at(b));
  past.sort((a, b) => at(b) - at(a));

  return { upcoming, past };
}

export type EventGroup = { id: string; label: string; events: EventSummary[] };

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Splits the upcoming list the way a gig listing reads: what is on in the
 * next seven days, what is left in this calendar month, then everything
 * after. Empty groups are dropped, so a quiet stretch never leaves a
 * heading with nothing under it.
 */
export function groupUpcoming(events: EventSummary[], now = new Date()): EventGroup[] {
  const weekEnd = now.getTime() + WEEK_MS;
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime();

  const week: EventSummary[] = [];
  const month: EventSummary[] = [];
  const later: EventSummary[] = [];

  for (const event of events) {
    const at = new Date(event.eventDate).getTime();
    if (at < weekEnd) week.push(event);
    else if (at < monthEnd) month.push(event);
    else later.push(event);
  }

  return [
    { id: "week", label: "This week", events: week },
    { id: "month", label: "Later this month", events: month },
    { id: "later", label: "Later", events: later },
  ].filter((group) => group.events.length > 0);
}
