"use server";

import { requireAdmin } from "@/lib/admin/require-admin";
import {
  listRevolutWebhooks,
  getRevolutWebhook,
  createRevolutWebhook,
  REVOLUT_ORDER_EVENTS,
  type RevolutWebhook,
} from "@/lib/checkout/revolut";

export type RegisterResult = { alreadyRegistered: boolean; webhook: RevolutWebhook };

/**
 * Idempotent: if a webhook already points at the given URL, re-fetches it
 * (to get its signing_secret, which the list endpoint omits) instead of
 * creating a duplicate. Revolut caps accounts at 10 webhooks total.
 */
export async function registerRevolutWebhook(url: string): Promise<RegisterResult> {
  await requireAdmin();

  const trimmed = url.trim();
  if (!trimmed.startsWith("https://")) {
    throw new Error("Webhook URL must be https://");
  }

  const existing = await listRevolutWebhooks();
  const match = existing.find((w) => w.url === trimmed);

  if (match) {
    const full = await getRevolutWebhook(match.id);
    return { alreadyRegistered: true, webhook: full };
  }

  const created = await createRevolutWebhook({ url: trimmed, events: REVOLUT_ORDER_EVENTS });
  return { alreadyRegistered: false, webhook: created };
}

export async function listExistingWebhooks(): Promise<RevolutWebhook[]> {
  await requireAdmin();
  return listRevolutWebhooks();
}
