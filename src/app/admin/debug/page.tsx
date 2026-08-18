import { requireAdmin } from "@/lib/admin/require-admin";
import { formatDate } from "@/lib/format";
import styles from "../admin.module.css";

export default async function AdminDebugPage() {
  const { supabase } = await requireAdmin();
  const { data: errors } = await supabase
    .from("webhook_errors")
    .select("id, source, message, context, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Debug</h2>
      </div>
      <p className={styles.hint} style={{ marginBottom: "var(--space-md)" }}>
        Failures from the Revolut and Merchize webhooks that need a human to look at — a paid
        order that never reached Merchize, or a status update that couldn&rsquo;t be matched to
        an order. Not a general error log; check Vercel&rsquo;s function logs for everything else.
      </p>

      {!errors || errors.length === 0 ? (
        <p className={styles.empty}>No webhook errors recorded.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>When</th>
                <th>Source</th>
                <th>Message</th>
                <th>Context</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e) => (
                <tr key={e.id}>
                  <td className={styles.rowMeta}>{formatDate(e.created_at)}</td>
                  <td>
                    <span className={styles.badgeStatus}>{e.source}</span>
                  </td>
                  <td className={styles.rowTitle}>{e.message}</td>
                  <td className={styles.rowMeta}>
                    {e.context ? <code>{JSON.stringify(e.context)}</code> : "—"}
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
