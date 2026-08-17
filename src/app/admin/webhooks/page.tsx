import { requireAdmin } from "@/lib/admin/require-admin";
import { listRevolutWebhooks } from "@/lib/checkout/revolut";
import { WebhooksPanel } from "./WebhooksPanel";

export default async function AdminWebhooksPage() {
  await requireAdmin();

  let existing: Awaited<ReturnType<typeof listRevolutWebhooks>> = [];
  let loadError: string | null = null;
  try {
    existing = await listRevolutWebhooks();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not reach Revolut.";
  }

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Webhooks</h2>
      <p style={{ color: "var(--fg-muted)", marginBottom: "var(--space-lg)", maxWidth: "60ch" }}>
        Revolut has no webhook UI in the Business dashboard on this account, so it&rsquo;s registered here
        instead, via their API. This is safe to revisit any time — registering an already-registered URL just
        re-shows its signing secret rather than creating a duplicate (Revolut caps accounts at 10 webhooks total).
      </p>
      <WebhooksPanel initialWebhooks={existing} initialError={loadError} />
    </div>
  );
}
