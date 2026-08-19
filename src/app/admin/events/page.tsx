import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatEventDateTime, formatPrice } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleEventPublish, deleteEvent } from "./actions";
import styles from "../admin.module.css";

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();
  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, location, organizer, event_date, is_published, price_cents, currency, capacity, capacity_remaining"
    )
    .order("event_date", { ascending: false });

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Events</h2>
        <div className={styles.actions}>
          <Link href="/admin/tickets" className={styles.linkBtn}>
            View tickets
          </Link>
          <Link href="/admin/checkin" className={styles.linkBtn}>
            Check in tickets
          </Link>
          <Link href="/admin/events/new" className={styles.linkBtn}>
            + New event
          </Link>
        </div>
      </div>

      {!events || events.length === 0 ? (
        <p className={styles.empty}>No events yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Location</th>
                <th>Price</th>
                <th>Pax sold</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className={styles.rowTitle}>{event.title}</td>
                  <td className={styles.rowMeta}>{formatEventDateTime(event.event_date)}</td>
                  <td className={styles.rowMeta}>
                    {event.location ?? "—"}
                    {event.organizer && (
                      <>
                        <br />
                        <em>Hosted by {event.organizer}</em>
                      </>
                    )}
                  </td>
                  <td className={styles.rowMeta}>
                    {event.price_cents > 0 ? formatPrice(event.price_cents, event.currency) : "Free"}
                  </td>
                  <td className={styles.rowMeta}>
                    {event.capacity != null
                      ? `${event.capacity - (event.capacity_remaining ?? event.capacity)} / ${event.capacity}`
                      : "Unlimited"}
                  </td>
                  <td>
                    <PublishBadge isPublished={event.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/events/${event.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleEventPublish.bind(null, event.id, !event.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {event.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteEvent.bind(null, event.id)}>
                        <button type="submit" className={styles.dangerBtn}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
