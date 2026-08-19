import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyRevolutSignature } from "@/lib/checkout/revolut";
import { createMerchizeOrder, type MerchizeShipping } from "@/lib/checkout/merchize";
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

  // merchant_order_ext_ref is the orders.id we supplied when creating the
  // Revolut order — round-tripped so we never depend on knowing Revolut's
  // own internal order-id field name.
  const nested = (event.order ?? event.data ?? {}) as Record<string, unknown>;
  const orderId =
    (event.merchant_order_ext_ref as string | undefined) ??
    (nested.merchant_order_ext_ref as string | undefined);

  if (!eventType || !orderId) {
    // A signature-valid Revolut webhook whose shape we don't recognize —
    // rare enough (unlike a bad signature, which is just internet noise)
    // that it's worth a record instead of a silent 400.
    await logWebhookError("revolut", "Webhook missing event type or order reference", {
      body: event,
    });
    return NextResponse.json({ error: "Missing event type or order reference" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Event-ticket purchases are round-tripped as "ticket:<event_tickets.id>"
  // so they share this same webhook without being confused for a shop order.
  if (orderId.startsWith("ticket:")) {
    const ticketId = orderId.slice("ticket:".length);

    if (PAYMENT_COMPLETED_EVENTS.has(eventType)) {
      // Same atomic-conditional-update pattern as orders below: only the
      // request that actually flips pending -> paid decrements capacity.
      const { data: updated } = await supabase
        .from("event_tickets")
        .update({ status: "paid" })
        .eq("id", ticketId)
        .eq("status", "pending")
        .select("event_id, quantity")
        .maybeSingle();

      if (updated) {
        await supabase.rpc("decrement_event_capacity", {
          p_event_id: updated.event_id,
          p_quantity: updated.quantity,
        });
      } else {
        await warnIfMissing(supabase, "event_tickets", ticketId, orderId, eventType);
      }
    } else if (PAYMENT_FAILED_EVENTS.has(eventType)) {
      await supabase
        .from("event_tickets")
        .update({ status: "cancelled" })
        .eq("id", ticketId)
        .eq("status", "pending");
    } else {
      await logWebhookError("revolut", `Unhandled event type for a ticket order: ${eventType}`, { orderId });
    }

    return NextResponse.json({ received: true });
  }

  if (PAYMENT_COMPLETED_EVENTS.has(eventType)) {
    // Atomic conditional update: only the request that actually flips
    // pending -> paid proceeds to decrement stock, so a retried webhook
    // delivery can never double-decrement.
    const { data: updated } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("id", orderId)
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

      await submitToMerchize(supabase, updated.id, items ?? []);
    } else {
      await warnIfMissing(supabase, "orders", orderId, orderId, eventType);
    }
  } else if (PAYMENT_FAILED_EVENTS.has(eventType)) {
    await supabase.from("orders").update({ status: "cancelled" }).eq("id", orderId).eq("status", "pending");
  } else {
    await logWebhookError("revolut", `Unhandled event type for a shop order: ${eventType}`, { orderId });
  }

  return NextResponse.json({ received: true });
}

/**
 * A completed-payment webhook that didn't flip anything to `paid` is
 * usually just a retried delivery arriving after the row was already
 * settled — expected, not an error. It's only worth a debug-log entry
 * when the row doesn't exist at all, since that means real money moved on
 * Revolut's side with nothing on ours to reconcile it against.
 */
async function warnIfMissing(
  supabase: ReturnType<typeof createAdminClient>,
  table: "orders" | "event_tickets",
  rowId: string,
  orderId: string,
  eventType: string
) {
  const { data: existing } = await supabase.from(table).select("id").eq("id", rowId).maybeSingle();
  if (!existing) {
    await logWebhookError("revolut", `Payment completed for unknown ${table === "orders" ? "order" : "ticket"}`, {
      orderId,
      eventType,
    });
  }
}

/**
 * Submits the now-paid order to Merchize for fulfilment. Never throws —
 * payment already succeeded and stock is already decremented by the time
 * this runs, so a Merchize-side failure must not block the 200 response to
 * Revolut (which would just cause them to retry a webhook whose payment-side
 * effects are already done). Failures are logged for manual follow-up.
 */
async function submitToMerchize(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: string,
  items: { variant_id: string; quantity: number }[]
) {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("customer_email, shipping_address")
      .eq("id", orderId)
      .single();

    const shippingAddress = (order?.shipping_address ?? null) as Partial<MerchizeShipping> | null;
    if (!order || !shippingAddress || !shippingAddress.address1) {
      await logWebhookError("merchize", "Submit skipped — no shipping address on order", { orderId });
      return;
    }

    if (items.length === 0) {
      await logWebhookError("merchize", "Submit skipped — order has no line items", { orderId });
      return;
    }

    const variantIds = items.map((item) => item.variant_id);
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, merchize_variant_code")
      .in("id", variantIds);

    const codeByVariant = new Map((variants ?? []).map((v) => [v.id, v.merchize_variant_code]));

    const merchizeItems = items.map((item) => {
      const code = codeByVariant.get(item.variant_id);
      if (!code) {
        throw new Error(`No Merchize variant code set for product_variants.id=${item.variant_id}`);
      }
      return { variantCode: code, quantity: item.quantity };
    });

    const shipping: MerchizeShipping = {
      email: order.customer_email ?? "",
      firstName: shippingAddress.firstName ?? "",
      lastName: shippingAddress.lastName ?? "",
      address1: shippingAddress.address1 ?? "",
      address2: shippingAddress.address2 ?? "",
      city: shippingAddress.city ?? "",
      region: shippingAddress.region ?? "",
      postcode: shippingAddress.postcode ?? "",
      countryCode: shippingAddress.countryCode ?? "",
      phone: shippingAddress.phone ?? "",
    };

    const merchizeOrder = await createMerchizeOrder({ externalId: orderId, shipping, items: merchizeItems });

    await supabase
      .from("orders")
      .update({
        merchize_order_id:
          (merchizeOrder.id as string | undefined) ?? (merchizeOrder.order_id as string | undefined) ?? null,
        merchize_status: "submitted",
      })
      .eq("id", orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logWebhookError("merchize", `Submission failed: ${message}`, { orderId });
  }
}
