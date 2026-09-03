"use client";

import { useState } from "react";
import { formatPrice, formatDate } from "@/lib/format";
import { lookupDealRedemption, type DealRedemptionLookup } from "./actions";
import { ApproveRedemptionButton } from "./ApproveRedemptionButton";
import styles from "../admin.module.css";

export function DealCheckInForm() {
  const [code, setCode] = useState("");
  const [redemption, setRedemption] = useState<DealRedemptionLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRedemption(null);
    try {
      const result = await lookupDealRedemption(code);
      if (!result) {
        setError("No deal found with that code.");
      } else {
        setRedemption(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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

      {redemption && (
        <div
          className={styles.stat}
          style={{ marginTop: "var(--space-md)", maxWidth: 420, textAlign: "left" }}
        >
          <p className={styles.rowTitle}>{redemption.dealTitle}</p>
          <p className={styles.rowMeta}>{redemption.vendorName}</p>
          <p style={{ marginTop: "var(--space-sm)", fontSize: "1.4rem", fontWeight: 700 }}>
            {formatPrice(redemption.total_cents, redemption.currency)}
          </p>
          <p className={styles.rowMeta} style={{ marginTop: "0.25rem" }}>
            Status: {redemption.status}
          </p>

          {redemption.approved_at ? (
            <p style={{ marginTop: "var(--space-sm)", color: "var(--accent)", fontWeight: 600 }}>
              Already approved — {formatDate(redemption.approved_at)}
              {redemption.redeemed_location && ` — ${redemption.redeemed_location}`}
            </p>
          ) : redemption.status === "paid" ? (
            <div style={{ marginTop: "var(--space-sm)" }}>
              <ApproveRedemptionButton
                redemptionId={redemption.id}
                locations={redemption.dealLocations}
                onApproved={(redeemedLocation) =>
                  setRedemption({
                    ...redemption,
                    status: "paid",
                    approved_at: new Date().toISOString(),
                    redeemed_location: redeemedLocation,
                  })
                }
              />
            </div>
          ) : (
            <p style={{ marginTop: "var(--space-sm)", color: "var(--fg-muted)" }}>
              This deal hasn&rsquo;t been paid — do not approve.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
