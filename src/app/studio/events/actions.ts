"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRevolutOrder } from "@/lib/checkout/revolut";

/**
 * Starts a ticket purchase. Requires a signed-in buyer — unlike the shop,
 * a ticket only means something tied to an account (that's how the buyer
 * proves it at the door and how staff find it to check them in).
 */
export async function startTicketCheckout(eventId: string, quantity: number) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Choose at least 1 ticket.");
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    throw new Error("Sign in to buy tickets.");
  }

  const supabase = createAdminClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, title, price_cents, currency, is_published, capacity, capacity_remaining")
    .eq("id", eventId)
    .single();
  if (eventError || !event || !event.is_published) {
    throw new Error("This event is no longer available.");
  }

  if (event.capacity != null && quantity > (event.capacity_remaining ?? 0)) {
    throw new Error(
      event.capacity_remaining && event.capacity_remaining > 0
        ? `Only ${event.capacity_remaining} spot(s) left for this event.`
        : "This event is sold out."
    );
  }

  const totalCents = event.price_cents * quantity;

  const { data: ticket, error: ticketError } = await supabase
    .from("event_tickets")
    .insert({
      event_id: event.id,
      user_id: user.id,
      quantity,
      unit_price_cents: event.price_cents,
      total_cents: totalCents,
      currency: event.currency,
      status: "pending",
    })
    .select("id")
    .single();
  if (ticketError || !ticket) throw new Error(ticketError?.message ?? "Could not start checkout.");

  // Free tickets never touch Revolut — nothing to pay for.
  if (totalCents === 0) {
    await supabase.from("event_tickets").update({ status: "paid" }).eq("id", ticket.id);
    if (event.capacity != null) {
      await supabase.rpc("decrement_event_capacity", { p_event_id: event.id, p_quantity: quantity });
    }
    return { checkoutUrl: `/account/tickets?ticket=${ticket.id}` };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`;

  const { checkoutUrl, revolutOrderId } = await createRevolutOrder({
    amountCents: totalCents,
    currency: event.currency,
    orderId: `ticket:${ticket.id}`,
    redirectUrl: `${origin}/account/tickets?ticket=${ticket.id}`,
  });

  if (revolutOrderId) {
    await supabase.from("event_tickets").update({ revolut_order_id: revolutOrderId }).eq("id", ticket.id);
  }

  return { checkoutUrl };
}
