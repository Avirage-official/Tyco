"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/format";
import { DECLINE_REASONS, REVERSAL_REASONS } from "@/lib/deals/doorReasons";
import { approveDealCheckIn, declineDealCheckIn, reverseDealDecline } from "./actions";
import styles from "./deals.module.css";

type DoorRedemption = {
  id: string;
  approved_at: string | null;
  approved_by_name: string | null;
  declined_at: string | null;
  declined_by_name: string | null;
  declined_reasons: string[] | null;
  reversed_at: string | null;
  reversed_by_name: string | null;
  reversed_reasons: string[] | null;
};

/**
 * The counter flow, on the member's own deal — vendor staff have no Tyco
 * account, so there's no separate staff-facing screen: the member shows this
 * already-signed-in page, staff type their own name and tap a decision. Same
 * shape as the event door panel in ../tickets/TicketDoorPanel.tsx, including
 * keeping the decision behind a Modal so a stray scroll-tap can't approve a
 * redemption.
 *
 * A decline records what happened and hands the month's slot back. It never
 * moves money: Tyco settles a refund separately, once it has checked with the
 * vendor.
 */
export function DealDoorPanel({ redemption: initial }: { redemption: DoorRedemption }) {
  const router = useRouter();
  const [redemption, setRedemption] = useState(initial);
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

  async function run(action: () => Promise<DoorRedemption>) {
    setPending(true);
    setError(null);
    try {
      const updated = await action();
      setRedemption(updated);
      closeModal();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (redemption.approved_at) {
    return (
      <div className={styles.doorStatus}>
        <p className={styles.approved}>
          Redeemed {formatDate(redemption.approved_at)}
          {redemption.approved_by_name ? ` — by ${redemption.approved_by_name}` : ""}
        </p>
        {redemption.reversed_at && redemption.declined_by_name && (
          <p className={styles.doorHistory}>
            Originally declined by {redemption.declined_by_name}
            {redemption.declined_reasons?.length ? ` (${redemption.declined_reasons.join(", ")})` : ""},
            then reversed by {redemption.reversed_by_name}
            {redemption.reversed_reasons?.length ? ` (${redemption.reversed_reasons.join(", ")})` : ""}.
          </p>
        )}
      </div>
    );
  }

  if (redemption.declined_at) {
    return (
      <div className={styles.doorStatus}>
        <p className={styles.declined}>
          Declined {formatDate(redemption.declined_at)}
          {redemption.declined_by_name ? ` — by ${redemption.declined_by_name}` : ""}
          {redemption.declined_reasons?.length ? ` (${redemption.declined_reasons.join(", ")})` : ""}
        </p>
        <p className={styles.doorHistory}>
          We&rsquo;ll check this with the vendor and get back to you about a refund.
        </p>
        <button type="button" className={styles.doorOpenBtn} onClick={() => setOpen(true)}>
          Reverse this decision
        </button>

        <Modal open={open} onClose={closeModal} labelledBy={titleId}>
          <div className={styles.doorModalBody}>
            <h2 id={titleId} className={styles.doorModalTitle}>
              Reverse decline
            </h2>
            <p className={styles.doorModalHint}>
              Staff: type your name and pick why this is being reversed.
            </p>
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
                  <input
                    type="checkbox"
                    checked={reasons.has(reason)}
                    onChange={() => toggleReason(reason)}
                  />
                  {reason}
                </label>
              ))}
            </div>
            {error && <p className={styles.doorError}>{error}</p>}
            <Button
              variant="ghost"
              onClick={() =>
                run(() => reverseDealDecline(redemption.id, staffName, Array.from(reasons)))
              }
              disabled={pending || !staffName.trim() || reasons.size === 0}
            >
              {pending ? "Reversing…" : "Reverse to redeemed"}
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className={styles.doorStatus}>
      <button type="button" className={styles.doorOpenBtn} onClick={() => setOpen(true)}>
        Redeem at the counter
      </button>

      <Modal open={open} onClose={closeModal} labelledBy={titleId}>
        <div className={styles.doorModalBody}>
          <h2 id={titleId} className={styles.doorModalTitle}>
            Redeem at the counter
          </h2>
          <p className={styles.doorModalHint}>
            Staff: type your name, then approve or decline this deal.
          </p>
          <input
            className={styles.doorInput}
            placeholder="Staff name"
            value={staffName}
            onChange={(e) => setStaffName(e.target.value)}
            autoFocus
          />
          <div className={styles.doorButtons}>
            <Button
              variant="ghost"
              onClick={() => run(() => approveDealCheckIn(redemption.id, staffName))}
              disabled={pending || !staffName.trim()}
            >
              {pending ? "Approving…" : "Approve"}
            </Button>
          </div>

          <p className={styles.doorModalHint}>Declining instead? Pick a reason:</p>
          <div className={styles.reasonList}>
            {DECLINE_REASONS.map((reason) => (
              <label key={reason} className={styles.reasonCheckbox}>
                <input
                  type="checkbox"
                  checked={reasons.has(reason)}
                  onChange={() => toggleReason(reason)}
                />
                {reason}
              </label>
            ))}
          </div>
          {error && <p className={styles.doorError}>{error}</p>}
          <Button
            variant="ghost"
            onClick={() => run(() => declineDealCheckIn(redemption.id, staffName, Array.from(reasons)))}
            disabled={pending || !staffName.trim() || reasons.size === 0}
          >
            {pending ? "Declining…" : "Confirm decline"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
