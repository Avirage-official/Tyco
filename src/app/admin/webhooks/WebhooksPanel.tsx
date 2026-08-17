"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { registerRevolutWebhook, type RegisterResult } from "./actions";
import type { RevolutWebhook } from "@/lib/checkout/revolut";
import styles from "../admin.module.css";

function defaultWebhookUrl() {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/api/webhooks/revolut`;
}

export function WebhooksPanel({
  initialWebhooks,
  initialError,
}: {
  initialWebhooks: RevolutWebhook[];
  initialError: string | null;
}) {
  const [url, setUrl] = useState(defaultWebhookUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [result, setResult] = useState<RegisterResult | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await registerRevolutWebhook(url);
      setResult(outcome);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <form className={styles.form} onSubmit={handleRegister} style={{ maxWidth: "48rem" }}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="webhook-url">
            Webhook URL
          </label>
          <input
            id="webhook-url"
            className={styles.input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.tyco.world/api/webhooks/revolut"
          />
          <p className={styles.hint}>
            Double check this points at your real production domain before submitting — it&rsquo;s easy to
            accidentally register a preview-deployment URL if this page was opened from one.
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.formActions}>
          <Button type="submit" disabled={busy || !url}>
            {busy ? "Registering…" : "Register / check webhook"}
          </Button>
        </div>
      </form>

      {result && (
        <div style={{ marginTop: "var(--space-lg)" }}>
          <p style={{ marginBottom: "var(--space-sm)" }}>
            {result.alreadyRegistered
              ? "Already registered — showing its details below."
              : "Registered successfully."}
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <tbody>
                <tr>
                  <td className={styles.rowMeta}>ID</td>
                  <td className={styles.rowMeta}>{result.webhook.id}</td>
                </tr>
                <tr>
                  <td className={styles.rowMeta}>URL</td>
                  <td className={styles.rowMeta}>{result.webhook.url}</td>
                </tr>
                <tr>
                  <td className={styles.rowMeta}>Events</td>
                  <td className={styles.rowMeta}>{result.webhook.events.join(", ")}</td>
                </tr>
                <tr>
                  <td className={styles.rowMeta}>Signing secret</td>
                  <td className={styles.rowMeta}>
                    <code>{result.webhook.signing_secret}</code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={styles.hint} style={{ marginTop: "var(--space-sm)" }}>
            Copy the signing secret above into <code>REVOLUT_WEBHOOK_SIGNING_SECRET</code> in Vercel&rsquo;s
            environment variables, then redeploy. (You can come back to this page any time to see it again —
            registering the same URL twice just re-shows it, it won&rsquo;t create a second webhook.)
          </p>
        </div>
      )}

      {!result && initialWebhooks.length > 0 && (
        <div style={{ marginTop: "var(--space-lg)" }}>
          <p style={{ color: "var(--fg-muted)", marginBottom: "var(--space-sm)" }}>
            Currently registered on this Revolut account:
          </p>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {initialWebhooks.map((w) => (
                  <tr key={w.id}>
                    <td className={styles.rowMeta}>{w.url}</td>
                    <td className={styles.rowMeta}>{w.events.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
