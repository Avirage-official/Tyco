import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatDate } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleEventPublish, deleteEvent } from "./actions";
import styles from "../admin.module.css";

export default async function AdminEventsPage() {
  const { supabase } = await requireAdmin();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, location, event_date, is_published")
    .order("event_date", { ascending: false });

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Events</h2>
        <Link href="/admin/events/new" className={styles.linkBtn}>
          + New event
        </Link>
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
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td className={styles.rowTitle}>{event.title}</td>
                  <td className={styles.rowMeta}>{formatDate(event.event_date)}</td>
                  <td className={styles.rowMeta}>{event.location ?? "—"}</td>
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
