"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/format";
import { DENIAL_REASONS, REVERSAL_REASONS } from "@/lib/tickets/doorReasons";
import { approveTicketCheckIn, denyTicketCheckIn, reverseTicketDenial } from "./actions";
import styles from "./tickets.module.css";

type DoorTicket = {
  id: string;
  checked_in_at: string | null;
  checked_in_by_name: string | null;
  denied_at: string | null;
  denied_by_name: string | null;
  denied_reasons: string[] | null;
  reversed_at: string | null;
  reversed_by_name: string | null;
  reversed_reasons: string[] | null;
};

/**
 * The door flow, right on the buyer's own ticket — venue staff have no
 * Tyco account, so there's no separate staff-facing screen: the buyer
 * shows this already-signed-in page to staff, who type their own name and
 * tap a decision. See supabase/schema.sql's comment on event_tickets'
 * door-decision columns for the full reasoning.
 *
 * Approve/Deny/Reverse live behind a Modal rather than sitting exposed in
 * the ticket list — this card scrolls past on both mobile and desktop
 * like any other list item, and a bare inline button was too easy to tap
 * by accident while scrolling. Opening the sheet is the deliberate step;
 * only what's inside it can actually change the ticket's status.
 */
export function TicketDoorPanel({ ticket: initialTicket }: { ticket: DoorTicket }) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initialTicket);
  const [open, setOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [reasons, setReasons] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  function closeModal() {
    setOpen(false);
    setStaffName("");
    setReasons(new Set());
    setError(null);
  }

  function toggleReason(reason: string) {
    setReasons((prev) => {
      const next = new Set(prev);
      if (next.has(reason)) next.delete(reason);
      else next.add(reason);
      return next;
    });
  }

  async function handleApprove() {
    setPending(true);
    setError(null);
    try {
      const updated = await approveTicketCheckIn(ticket.id, staffName);
      setTicket(updated);
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleDeny() {
    setPending(true);
    setError(null);
    try {
      const updated = await denyTicketCheckIn(ticket.id, staffName, Array.from(reasons));
      setTicket(updated);
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  async function handleReverse() {
    setPending(true);
    setError(null);
    try {
      const updated = await reverseTicketDenial(ticket.id, staffName, Array.from(reasons));
      setTicket(updated);
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPending(false);
    }
  }

  if (ticket.checked_in_at) {
    return (
      <div className={styles.doorStatus}>
        <p className={styles.checkedIn}>
          Checked in {formatDate(ticket.checked_in_at)}
          {ticket.checked_in_by_name ? ` — by ${ticket.checked_in_by_name}` : ""}
        </p>
        {ticket.reversed_at && ticket.denied_by_name && (
          <p className={styles.doorHistory}>
            Originally denied by {ticket.denied_by_name}
            {ticket.denied_reasons?.length ? ` (${ticket.denied_reasons.join(", ")})` : ""}, then reversed
            by {ticket.reversed_by_name}
            {ticket.reversed_reasons?.length ? ` (${ticket.reversed_reasons.join(", ")})` : ""}.
          </p>
        )}
      </div>
    );
  }

  if (ticket.denied_at) {
    return (
      <div className={styles.doorStatus}>
        <p className={styles.denied}>
          Denied {formatDate(ticket.denied_at)}
          {ticket.denied_by_name ? ` — by ${ticket.denied_by_name}` : ""}
          {ticket.denied_reasons?.length ? ` (${ticket.denied_reasons.join(", ")})` : ""}
        </p>
        <button type="button" className={styles.doorOpenBtn} onClick={() => setOpen(true)}>
          Reverse this decision
        </button>

        <Modal open={open} onClose={closeModal} labelledBy={titleId}>
          <div className={styles.doorModalBody}>
            <h2 id={titleId} className={styles.doorModalTitle}>
              Reverse denial
            </h2>
            <p className={styles.doorModalHint}>Staff: type your name and pick why this is being reversed.</p>
            <input
              className={styles.doorInput}
              placeholder="Staff name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              autoFocus
            />
            <div className={styles.reasonList}>
              {REVERSAL_REASONS.map((reason) => (
                <label key={reason} className={styles.reasonCheckbox}>
                  <input type="checkbox" checked={reasons.has(reason)} onChange={() => toggleReason(reason)} />
                  {reason}
                </label>
              ))}
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <Button
              variant="ghost"
              onClick={handleReverse}
              disabled={pending || !staffName.trim() || reasons.size === 0}
            >
              {pending ? "Reversing…" : "Reverse to approved"}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.doorStatus}>
      <button type="button" className={styles.doorOpenBtn} onClick={() => setOpen(true)}>
        Door check-in
      </button>

      <Modal open={open} onClose={closeModal} labelledBy={titleId}>
        <div className={styles.doorModalBody}>
          <h2 id={titleId} className={styles.doorModalTitle}>
            Door check-in
          </h2>
          <p className={styles.doorModalHint}>Staff: type your name, then Approve or Deny this ticket.</p>
          <input
            className={styles.doorInput}
            placeholder="Staff name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            autoFocus
          />
          <div className={styles.doorButtons}>
            <Button variant="ghost" onClick={handleApprove} disabled={pending || !staffName.trim()}>
              {pending ? "Approving…" : "Approve"}
            </Button>
          </div>

          <p className={styles.doorModalHint}>Denying instead? Pick a reason:</p>
          <div className={styles.reasonList}>
            {DENIAL_REASONS.map((reason) => (
              <label key={reason} className={styles.reasonCheckbox}>
                <input type="checkbox" checked={reasons.has(reason)} onChange={() => toggleReason(reason)} />
                {reason}
              </label>
            ))}
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <Button
            variant="ghost"
            onClick={handleDeny}
            disabled={pending || !staffName.trim() || reasons.size === 0}
          >
            {pending ? "Denying…" : "Confirm deny"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
