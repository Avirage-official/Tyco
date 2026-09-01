import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRevolutSignature } from "@/lib/checkout/revolut";
import { submitOrderToMerchize } from "@/lib/checkout/fulfillment";
import { logWebhookError } from "@/lib/checkout/webhookErrors";

const PAYMENT_COMPLETED_EVENTS = new Set(["ORDER_COMPLETED", "ORDER_AUTHORISED"]);
const PAYMENT_FAILED_EVENTS = new Set(["ORDER_CANCELLED", "ORDER_PAYMENT_DECLINED", "ORDER_PAYMENT_FAILED"]);

/**
 * Receives payment-status events from Revolut. Register this route's full
 * URL (https://<your-domain>/api/webhooks/revolut) in the Revolut Business
 * dashboard under the Merchant API webhook settings, and copy the signing
 * secret it gives you into REVOLUT_WEBHOOK_SIGNING_SECRET.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const valid = verifyRevolutSignature({
    rawBody,
    signatureHeader: request.headers.get("revolut-signature"),
    timestampHeader: request.headers.get("revolut-request-timestamp"),
  });

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = typeof event.event === "string" ? event.event : (event.type as string | undefined);

  // Revolut's actual webhook payload is thin — just { event, order_id } —
  // using *their* order id, not the merchant_order_ext_ref we sent when
  // creating the order (confirmed against a real live delivery; it is
  // never echoed back). We already store that same id as revolut_order_id
  // on the orders/event_tickets row at checkout time, so match on that
  // instead of a field Revolut doesn't actually send.
  const nested = (event.order ?? event.data ?? {}) as Record<string, unknown>;
  const revolutOrderId =
    (event.order_id as string | undefined) ??
    (nested.id as string | undefined) ??
    (event.id as string | undefined);

  if (!eventType || !revolutOrderId) {
    // A signature-valid Revolut webhook whose shape we don't recognize —
    // rare enough (unlike a bad signature, which is just internet noise)
    // that it's worth a record instead of a silent 400.
    await logWebhookError("revolut", "Webhook missing event type or order id", {
      body: event,
    });
    return NextResponse.json({ error: "Missing event type or order id" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // A Revolut order id belongs to exactly one of these three tables — look
  // each up rather than relying on any prefix trick, since Revolut's own
  // id carries no signal about which kind of purchase it was.
  const { data: dealMatch } = await supabase
    .from("deal_redemptions")
    .select("id, deal_cycle_id")
    .eq("revolut_order_id", revolutOrderId)
    .maybeSingle();

  if (dealMatch) {
    if (PAYMENT_COMPLETED_EVENTS.has(eventType)) {
      // Same atomic conditional update as the ticket/order branches below —
      // only the request that actually flips pending -> paid increments the
      // cycle's redemption count, so a retried webhook delivery can never
      // double-count against the monthly cap.
      const { data: updated } = await supabase
        .from("deal_redemptions")
        .update({ status: "paid" })
        .eq("id", dealMatch.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

      if (updated) {
        await supabase.rpc("increment_deal_cycle_redemptions", {
          p_cycle_id: dealMatch.deal_cycle_id,
          p_quantity: 1,
        });
      }
    } else if (PAYMENT_FAILED_EVENTS.has(eventType)) {
      await supabase
        .from("deal_redemptions")
        .update({ status: "cancelled" })
        .eq("id", dealMatch.id)
        .eq("status", "pending");
    } else {
      await logWebhookError("revolut", `Unhandled event type for a deal redemption: ${eventType}`, {
        revolutOrderId,
      });
    }

    return NextResponse.json({ received: true });
  }

  const { data: ticketMatch } = await supabase
    .from("event_tickets")
    .select("id")
    .eq("revolut_order_id", revolutOrderId)
    .maybeSingle();

  if (ticketMatch) {
    if (PAYMENT_COMPLETED_EVENTS.has(eventType)) {
      // Atomic conditional update: only the request that actually flips
      // pending -> paid decrements capacity, so a retried webhook delivery
      // can never double-decrement.
      const { data: updated } = await supabase
        .from("event_tickets")
        .update({ status: "paid" })
        .eq("id", ticketMatch.id)
        .eq("status", "pending")
        .select("event_id, quantity")
        .maybeSingle();

      if (updated) {
        await supabase.rpc("decrement_event_capacity", {
          p_event_id: updated.event_id,
          p_quantity: updated.quantity,
        });
      }
    } else if (PAYMENT_FAILED_EVENTS.has(eventType)) {
      await supabase
        .from("event_tickets")
        .update({ status: "cancelled" })
        .eq("id", ticketMatch.id)
        .eq("status", "pending");
    } else {
      await logWebhookError("revolut", `Unhandled event type for a ticket order: ${eventType}`, {
        revolutOrderId,
      });
    }

    return NextResponse.json({ received: true });
  }

  const { data: orderMatch } = await supabase
    .from("orders")
    .select("id")
    .eq("revolut_order_id", revolutOrderId)
    .maybeSingle();

  if (!orderMatch) {
    // Real money moved on Revolut's side with nothing on ours to reconcile
    // it against — always worth a record, unlike a merely-idempotent retry.
    await logWebhookError("revolut", "No order or ticket found for this Revolut order id", {
      revolutOrderId,
      eventType,
    });
    return NextResponse.json({ received: true });
  }

  if (PAYMENT_COMPLETED_EVENTS.has(eventType)) {
    // Atomic conditional update: only the request that actually flips
    // pending -> paid proceeds to decrement stock, so a retried webhook
    // delivery can never double-decrement.
    const { data: updated } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderMatch.id)
      .eq("status", "pending")
      .select("id")
      .maybeSingle();

    if (updated) {
      const { data: items } = await supabase
        .from("order_items")
        .select("variant_id, quantity")
        .eq("order_id", updated.id);

      for (const item of items ?? []) {
        await supabase.rpc("decrement_variant_stock", {
          p_variant_id: item.variant_id,
          p_quantity: item.quantity,
        });
      }
    }

    // Not gated on `updated` — a completed-payment delivery that arrives
    // after the order was already marked paid (a retried delivery, or one
    // that lost a race with another) must still get a chance to reach
    // Merchize. submitOrderToMerchize is itself idempotent (it no-ops once
    // merchize_status is set), so calling it on every such delivery is safe
    // and closes the gap where a paid order could otherwise never be
    // submitted.
    await submitOrderToMerchize(supabase, orderMatch.id);
  } else if (PAYMENT_FAILED_EVENTS.has(eventType)) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderMatch.id).eq("status", "pending");
  } else {
    await logWebhookError("revolut", `Unhandled event type for a shop order: ${eventType}`, {
      revolutOrderId,
    });
  }

  return NextResponse.json({ received: true });
}
