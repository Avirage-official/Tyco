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
        "id, event_id, user_id, quantity, total_cents, currency, status, reference_code, checked_in_at, checked_in_by_name, denied_at, denied_by_name, denied_reasons, reversed_at, reversed_by_name, reversed_reasons, created_at"
      )
      .order("created_at", { ascending: false }),
    supabase.from("events").select("id, title"),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  const eventTitleById = new Map((events ?? []).map((e) => [e.id, e.title]));
  const emailByUserId = new Map((userList?.users ?? []).map((u) => [u.id, u.email]));

  /** Matches /admin/deal-redemptions: the door decision sits on the holder's
   *  own phone, so a repeat denier is the signal worth watching. */
  const DENIAL_FLAG_THRESHOLD = 5;

  const paidTickets = (tickets ?? []).filter((t) => t.status === "paid");
  const revenueCents = paidTickets.reduce((sum, t) => sum + t.total_cents, 0);
  const paxSold = paidTickets.reduce((sum, t) => sum + t.quantity, 0);
  const deniedCount = paidTickets.filter((t) => t.denied_at).length;

  const denialsByUser = new Map<string, number>();
  for (const t of tickets ?? []) {
    if (!t.denied_at) continue;
    denialsByUser.set(t.user_id, (denialsByUser.get(t.user_id) ?? 0) + 1);
  }

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
        <div className={styles.stat}>
          <div className={styles.statValue}>{deniedCount}</div>
          <div className={styles.statLabel}>Denied at the door</div>
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
                  <td className={styles.rowMeta}>
                    {emailByUserId.get(ticket.user_id) ?? "—"}
                    {(denialsByUser.get(ticket.user_id) ?? 0) >= DENIAL_FLAG_THRESHOLD && (
                      <span className={`${styles.badge} ${styles.badgeDraft}`} style={{ marginLeft: "0.4rem" }}>
                        {denialsByUser.get(ticket.user_id)} denials
                      </span>
                    )}
                  </td>
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
                    {ticket.checked_in_at ? (
                      <>
                        {formatDate(ticket.checked_in_at)}
                        {ticket.checked_in_by_name ? ` — ${ticket.checked_in_by_name}` : ""}
                        {ticket.reversed_at && ticket.denied_by_name && (
                          <div>
                            Denied by {ticket.denied_by_name}
                            {ticket.denied_reasons?.length ? ` (${ticket.denied_reasons.join(", ")})` : ""},
                            reversed by {ticket.reversed_by_name}
                            {ticket.reversed_reasons?.length
                              ? ` (${ticket.reversed_reasons.join(", ")})`
                              : ""}
                          </div>
                        )}
                      </>
                    ) : ticket.denied_at ? (
                      <>
                        Denied{ticket.denied_by_name ? ` by ${ticket.denied_by_name}` : ""}
                        {ticket.denied_reasons?.length ? ` (${ticket.denied_reasons.join(", ")})` : ""}
                      </>
                    ) : (
                      "—"
                    )}
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
