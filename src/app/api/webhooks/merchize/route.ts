import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logWebhookError } from "@/lib/checkout/webhookErrors";

/**
 * Receives fulfilment-status events from Merchize (order accepted, shipped,
 * tracking added, etc.) and updates the matching order. Register this
 * route's full URL (https://<your-domain>/api/webhooks/merchize) in the
 * Merchize dashboard under Webhooks, selecting whichever order-lifecycle
 * events you want reflected here, and set MERCHIZE_WEBHOOK_KEY to the value
 * they give you.
 *
 * HONEST CAVEAT: Merchize's docs (as available when this was written) cover
 * the merchize-webhook-key header and retry rules, but not the exact event
 * payload shape. The field lookups below try a handful of plausible names
 * (external_id / order_id / status / tracking) defensively. Check the
 * actual payload in Vercel's function logs the first time a real event
 * arrives and tighten this once confirmed.
 *
 * Per Merchize's retry rule (5 attempts/day over 3 days, expects HTTP 200),
 * this always returns 200 once the webhook key is valid, even if the order
 * match or update fails — failures are logged for manual follow-up rather
 * than left to Merchize's retry budget.
 */
export async function POST(request: Request) {
  const providedKey = request.headers.get("merchize-webhook-key");
  if (!providedKey || providedKey !== process.env.MERCHIZE_WEBHOOK_KEY) {
    return NextResponse.json({ error: "Invalid webhook key" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const nested = (event.order ?? {}) as Record<string, unknown>;
    const externalId = (event.external_id ?? nested.external_id) as string | undefined;
    const merchizeOrderId = (event.order_id ?? event.id ?? nested.id) as string | undefined;
    const status = (event.status ?? event.fulfillment_status ?? nested.status) as string | undefined;
    const trackingNumber = (event.tracking_number ??
      (event.tracking as Record<string, unknown> | undefined)?.number) as string | undefined;
    const trackingUrl = (event.tracking_url ??
      (event.tracking as Record<string, unknown> | undefined)?.url) as string | undefined;

    const supabase = createAdminClient();

    const { data: order } = externalId
      ? await supabase.from("orders").select("id, status").eq("id", externalId).maybeSingle()
      : merchizeOrderId
        ? await supabase
            .from("orders")
            .select("id, status")
            .eq("merchize_order_id", merchizeOrderId)
            .maybeSingle()
        : { data: null };

    if (!order) {
      await logWebhookError("merchize", "No matching order for webhook event", {
        externalId,
        merchizeOrderId,
      });
      return NextResponse.json({ received: true });
    }

    const patch: {
      merchize_status?: string;
      tracking_number?: string;
      tracking_url?: string;
      merchize_order_id?: string;
      status?: "fulfilled";
    } = {};
    if (status) patch.merchize_status = status;
    if (trackingNumber) patch.tracking_number = trackingNumber;
    if (trackingUrl) patch.tracking_url = trackingUrl;
    if (merchizeOrderId) patch.merchize_order_id = merchizeOrderId;
    // Only bump the constrained `status` column on an actual shipment —
    // everything else stays informational in merchize_status.
    if (status && /ship/i.test(status) && order.status !== "fulfilled") {
      patch.status = "fulfilled";
    }

    if (Object.keys(patch).length > 0) {
      await supabase.from("orders").update(patch).eq("id", order.id);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logWebhookError("merchize", `Webhook processing failed: ${message}`);
  }

  return NextResponse.json({ received: true });
}
