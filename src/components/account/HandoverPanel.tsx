"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatEventDateTime } from "@/lib/format";
import styles from "./HandoverPanel.module.css";

export type HandoverDecision = {
  approvedAt: string | null;
  approvedByName: string | null;
  declinedAt: string | null;
  declinedByName: string | null;
  declinedReasons: string[] | null;
  reversedAt: string | null;
  reversedByName: string | null;
  reversedReasons: string[] | null;
};

type Props = {
  decision: HandoverDecision;
  /** What the member is handing over — "ticket" or "deal". */
  noun: string;
  /** The primary action, in the staff member's language: "Check in", "Redeem". */
  actionLabel: string;
  /** Past tense for the settled state: "Checked in", "Redeemed". */
  approvedLabel: string;
  declineReasons: readonly string[];
  reversalReasons: readonly string[];
  onApprove: (staffName: string) => Promise<HandoverDecision>;
  onDecline: (staffName: string, reasons: string[]) => Promise<HandoverDecision>;
  onReverse: (staffName: string, reasons: string[]) => Promise<HandoverDecision>;
  /** Shown under a decline so the member knows what happens next. */
  declineNote?: string;
};

/**
 * The hand-your-phone-over moment, shared by event tickets and deal
 * redemptions because staff at a door and staff at a counter are doing the
 * same job. Neither has a Tyco account, so the member opens this on their own
 * phone and passes it across; staff type their own name and decide.
 *
 * Two rules from how this is done elsewhere (Square and Stripe Terminal's
 * customer-facing screens, Apple Wallet, the POS handover pattern generally)
 * drive the layout:
 *
 * 1. One large filled primary action. The decline path sits behind a text
 *    link that reveals it, rather than as a same-weight button beside
 *    Approve — Apple's HIG and Material both keep a destructive action
 *    visually distinct from the confirming one, and a peer button next to
 *    Approve is exactly how a wrong tap happens at arm's length.
 * 2. The settled state has to read across a counter, so it is a full-width
 *    colour band naming who decided and when, not a line of grey text.
 */
export function HandoverPanel({
  decision: initial,
  noun,
  actionLabel,
  approvedLabel,
  declineReasons,
  reversalReasons,
  onApprove,
  onDecline,
  onReverse,
  declineNote,
}: Props) {
  const [decision, setDecision] = useState(initial);
  const [open, setOpen] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [showDecline, setShowDecline] = useState(false);
  const [reasons, setReasons] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  function closeModal() {
    setOpen(false);
    setStaffName("");
    setShowDecline(false);
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

  async function run(action: () => Promise<HandoverDecision>) {
    setPending(true);
    setError(null);
    try {
      setDecision(await action());
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  const history =
    decision.reversedAt && decision.declinedByName ? (
      <p className={styles.history}>
        Declined by {decision.declinedByName}
        {decision.declinedReasons?.length ? ` (${decision.declinedReasons.join(", ")})` : ""}, then
        reversed by {decision.reversedByName}
        {decision.reversedReasons?.length ? ` (${decision.reversedReasons.join(", ")})` : ""}.
      </p>
    ) : null;

  if (decision.approvedAt) {
    return (
      <div className={`${styles.band} ${styles.bandApproved}`} role="status">
        <p className={styles.bandTitle}>{approvedLabel}</p>
        <p className={styles.bandMeta}>
          {formatEventDateTime(decision.approvedAt)}
          {decision.approvedByName ? ` · ${decision.approvedByName}` : ""}
        </p>
        {history}
      </div>
    );
  }

  if (decision.declinedAt) {
    return (
      <>
        <div className={`${styles.band} ${styles.bandDeclined}`} role="status">
          <p className={styles.bandTitle}>Declined</p>
          <p className={styles.bandMeta}>
            {formatEventDateTime(decision.declinedAt)}
            {decision.declinedByName ? ` · ${decision.declinedByName}` : ""}
          </p>
          {decision.declinedReasons?.length ? (
            <p className={styles.bandMeta}>{decision.declinedReasons.join(", ")}</p>
          ) : null}
          {declineNote && <p className={styles.bandNote}>{declineNote}</p>}
        </div>
        <button type="button" className={styles.undo} onClick={() => setOpen(true)}>
          Staff: reverse this decision
        </button>

        <Modal open={open} onClose={closeModal} labelledBy={titleId}>
          <div className={styles.sheet}>
            <h2 id={titleId} className={styles.sheetTitle}>
              Reverse this decline
            </h2>
            <p className={styles.sheetHint}>Type your name and pick why it&rsquo;s being reversed.</p>
            <input
              className={styles.input}
              placeholder="Your name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              autoFocus
            />
            <fieldset className={styles.reasons}>
              <legend className={styles.reasonsLegend}>Reason</legend>
              {reversalReasons.map((reason) => (
                <label key={reason} className={styles.reason}>
                  <input
                    type="checkbox"
                    checked={reasons.has(reason)}
                    onChange={() => toggleReason(reason)}
                  />
                  {reason}
                </label>
              ))}
            </fieldset>
            {error && <p className={styles.error}>{error}</p>}
            <Button
              full
              onClick={() => run(() => onReverse(staffName, Array.from(reasons)))}
              disabled={pending || !staffName.trim() || reasons.size === 0}
            >
              {pending ? "Reversing…" : `Reverse to ${approvedLabel.toLowerCase()}`}
            </Button>
          </div>
        </Modal>
      </>
    );
  }

  return (
    <>
      <Button full onClick={() => setOpen(true)} className={styles.primary}>
        {actionLabel}
      </Button>
      <p className={styles.handHint}>Hand your phone to staff</p>

      <Modal open={open} onClose={closeModal} labelledBy={titleId}>
        <div className={styles.sheet}>
          <h2 id={titleId} className={styles.sheetTitle}>
            {actionLabel}
          </h2>
          <p className={styles.sheetHint}>
            Staff: type your name, then {actionLabel.toLowerCase()} this {noun}.
          </p>
          <input
            className={styles.input}
            placeholder="Your name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            autoFocus
          />

          {error && <p className={styles.error}>{error}</p>}

          <Button
            full
            onClick={() => run(() => onApprove(staffName))}
            disabled={pending || !staffName.trim()}
          >
            {pending && !showDecline ? "Confirming…" : actionLabel}
          </Button>

          {/* The decline path is deliberately not a button beside Approve —
              it reveals on request, so it cannot be hit by mistake. */}
          {!showDecline ? (
            <button type="button" className={styles.declineLink} onClick={() => setShowDecline(true)}>
              Can&rsquo;t honour this {noun}?
            </button>
          ) : (
            <div className={styles.declineBlock}>
              <fieldset className={styles.reasons}>
                <legend className={styles.reasonsLegend}>Why can&rsquo;t it be honoured?</legend>
                {declineReasons.map((reason) => (
                  <label key={reason} className={styles.reason}>
                    <input
                      type="checkbox"
                      checked={reasons.has(reason)}
                      onChange={() => toggleReason(reason)}
                    />
                    {reason}
                  </label>
                ))}
              </fieldset>
              <Button
                variant="ghost"
                full
                onClick={() => run(() => onDecline(staffName, Array.from(reasons)))}
                disabled={pending || !staffName.trim() || reasons.size === 0}
              >
                {pending ? "Declining…" : "Confirm decline"}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
