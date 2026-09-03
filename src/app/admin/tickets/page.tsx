import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatPrice } from "@/lib/format";
import { checkInTicketFromList, refundTicket } from "./actions";
import styles from "../admin.module.css";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default async function AdminTicketsPage() {
  const { supabase } = await requireAdmin();
  const admin = createAdminClient();

  await supabase.rpc("expire_stale_event_tickets");

  const [{ data: tickets }, { data: events }, { data: userList }] = await Promise.all([
    supabase
      .from("event_tickets")
      .select(
        "id, event_id, user_id, quantity, total_cents, currency, status, reference_code, checked_in_at, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("events").select("id, title"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const eventTitleById = new Map((events ?? []).map((e) => [e.id, e.title]));
  const emailByUserId = new Map((userList?.users ?? []).map((u) => [u.id, u.email]));

  const paidTickets = (tickets ?? []).filter((t) => t.status === "paid");
  const revenueCents = paidTickets.reduce((sum, t) => sum + t.total_cents, 0);
  const paxSold = paidTickets.reduce((sum, t) => sum + t.quantity, 0);

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Tickets</h2>
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>{formatPrice(revenueCents)}</div>
          <div className={styles.statLabel}>Ticket revenue (paid)</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{paxSold}</div>
          <div className={styles.statLabel}>Pax paid</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{(tickets ?? []).filter((t) => t.status === "pending").length}</div>
          <div className={styles.statLabel}>Pending payment</div>
        </div>
      </div>

      {!tickets || tickets.length === 0 ? (
        <p className={styles.empty}>No tickets sold yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Event</th>
                <th>Buyer</th>
                <th>Pax</th>
                <th>Total</th>
                <th>Purchased</th>
                <th>Status</th>
                <th>Check-in</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className={styles.rowTitle}>{ticket.reference_code}</td>
                  <td className={styles.rowMeta}>{eventTitleById.get(ticket.event_id) ?? "—"}</td>
                  <td className={styles.rowMeta}>{emailByUserId.get(ticket.user_id) ?? "—"}</td>
                  <td className={styles.rowMeta}>{ticket.quantity}</td>
                  <td className={styles.rowMeta}>{formatPrice(ticket.total_cents, ticket.currency)}</td>
                  <td className={styles.rowMeta}>{formatDate(ticket.created_at)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${
                        ticket.status === "paid" ? styles.badgePublished : styles.badgeDraft
                      }`}
                    >
                      {STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                  </td>
                  <td className={styles.rowMeta}>
                    {ticket.checked_in_at ? formatDate(ticket.checked_in_at) : "—"}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {ticket.status === "paid" && !ticket.checked_in_at && (
                        <form action={checkInTicketFromList.bind(null, ticket.id)}>
                          <button type="submit" className={styles.linkBtn}>
                            Check in
                          </button>
                        </form>
                      )}
                      {ticket.status === "paid" && (
                        <form action={refundTicket.bind(null, ticket.id)}>
                          <button type="submit" className={styles.dangerBtn}>
                            Refund
                          </button>
                        </form>
                      )}
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
