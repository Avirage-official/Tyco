"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { runFeedSyncNow } from "./actions";
import styles from "../admin.module.css";

function summarize(result: Awaited<ReturnType<typeof runFeedSyncNow>>) {
  const parts = [
    `${result.candidatesFound} found`,
    `${result.newCandidates} new`,
    `${result.inserted} inserted`,
  ];
  if (result.remaining) parts.push(`${result.remaining} left for the next run`);
  if (result.discoveryErrors.length > 0) {
    parts.push(`${result.discoveryErrors.length} discovery error(s) — see server logs`);
  }
  return parts.join(", ");
}

export function SyncButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleClick() {
    setPending(true);
    setMessage(null);
    try {
      const result = await runFeedSyncNow();
      setIsError(false);
      setMessage(summarize(result));
      router.refresh();
    } catch (err) {
      setIsError(true);
      setMessage(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={styles.syncBlock}>
      <button type="button" className={styles.linkBtn} onClick={handleClick} disabled={pending}>
        {pending ? "Running sync…" : "Run sync now"}
      </button>
      {message && <p className={isError ? styles.error : styles.success}>{message}</p>}
    </div>
  );
}
