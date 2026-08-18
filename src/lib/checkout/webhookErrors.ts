import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

/**
 * Records a webhook failure an admin should know about. Never throws —
 * a logging failure must not mask or interrupt the webhook handling it's
 * called from.
 */
export async function logWebhookError(
  source: "revolut" | "merchize",
  message: string,
  context?: Record<string, unknown>
) {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("webhook_errors")
      .insert({ source, message, context: (context as Json) ?? null });
  } catch (err) {
    console.error("Failed to record webhook error", source, message, err);
  }
}
