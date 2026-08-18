"use client";

import { useState } from "react";
import { formatDate } from "@/lib/format";
import { lookupTicket, checkInTicket, type TicketLookup } from "./actions";
import styles from "../admin.module.css";

export function CheckInForm() {
  const [code, setCode] = useState("");
  const [ticket, setTicket] = useState<TicketLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTicket(null);
    try {
      const result = await lookupTicket(code);
      if (!result) {
        setError("No ticket found with that code.");
      } else {
        setTicket(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckIn() {
    if (!ticket) return;
    setLoading(true);
    setError(null);
    try {
      const updated = await checkInTicket(ticket.id);
      setTicket(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check in this ticket.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleLookup} style={{ display: "flex", gap: "0.5rem", maxWidth: 420 }}>
        <input
          className={styles.input}
          placeholder="Reference code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <button type="submit" className={styles.linkBtn} disabled={loading}>
          Look up
        </button>
      </form>

      {error && <p className={styles.error} style={{ marginTop: "var(--space-sm)" }}>{error}</p>}

      {ticket && (
        <div
          className={styles.stat}
          style={{ marginTop: "var(--space-md)", maxWidth: 420, textAlign: "left" }}
        >
          <p className={styles.rowTitle}>{ticket.eventTitle}</p>
          <p className={styles.rowMeta}>{ticket.eventDate ? formatDate(ticket.eventDate) : ""}</p>
          <p style={{ marginTop: "var(--space-sm)", fontSize: "1.4rem", fontWeight: 700 }}>
            {ticket.quantity} pax
          </p>
          <p className={styles.rowMeta} style={{ marginTop: "0.25rem" }}>
            Status: {ticket.status}
          </p>

          {ticket.checked_in_at ? (
            <p style={{ marginTop: "var(--space-sm)", color: "var(--accent)", fontWeight: 600 }}>
              Already checked in — {formatDate(ticket.checked_in_at)}
            </p>
          ) : ticket.status === "paid" ? (
            <button
              type="button"
              className={styles.linkBtn}
              style={{ marginTop: "var(--space-sm)" }}
              onClick={handleCheckIn}
              disabled={loading}
            >
              Check in
            </button>
          ) : (
            <p style={{ marginTop: "var(--space-sm)", color: "var(--fg-muted)" }}>
              This ticket hasn&rsquo;t been paid — do not admit.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
