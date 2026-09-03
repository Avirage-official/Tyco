"use client";

import { useState } from "react";
import { approveDealRedemption } from "./actions";
import styles from "../admin.module.css";

/**
 * Approve control shared between the code-lookup form (/admin/deal-checkins)
 * and the full redemptions list (/admin/deal-redemptions). Only asks which
 * location when the deal actually has more than one — most vendors have
 * just one, and forcing a choice every time would be busywork.
 */
export function ApproveRedemptionButton({
  redemptionId,
  locations,
  onApproved,
}: {
  redemptionId: string;
  locations: string[];
  onApproved: (redeemedLocation: string | null) => void;
}) {
  const [location, setLocation] = useState(locations[0] ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    try {
      const chosen = locations.length > 0 ? location : null;
      await approveDealRedemption(redemptionId, chosen);
      onApproved(chosen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not approve this redemption.");
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
      {locations.length > 1 && (
        <select
          className={styles.select}
          style={{ padding: "0.3rem 0.5rem", fontSize: "0.8rem" }}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          {locations.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      )}
      <button type="button" className={styles.linkBtn} onClick={handleApprove} disabled={loading}>
        {loading ? "Approving…" : "Approve"}
      </button>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
