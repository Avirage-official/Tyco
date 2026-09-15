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
export async function startTicketCheckout(eventId: string, quantity: number, agreedToNoRefundPolicy: boolean) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Choose at least 1 ticket.");
  }
  if (!agreedToNoRefundPolicy) {
    throw new Error("You must agree that this purchase is final before buying.");
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
    .select("id, title, price_cents, currency, is_published, capacity, capacity_remaining, event_date")
    .eq("id", eventId)
    .single();
  if (eventError || !event || !event.is_published) {
    throw new Error("This event is no longer available.");
  }
  // The studio listing only ever links to upcoming events, but that's a
  // display-time filter — without this, a bookmarked/shared link to an
  // event that has since passed could still be bought.
  if (new Date(event.event_date).getTime() < Date.now()) {
    throw new Error("This event has already happened.");
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

  // Free tickets never touch Revolut — nothing to pay for. No money has
  // moved yet, so unlike the paid/webhook path below, an oversell here can
  // just be rejected outright rather than logged for manual cleanup.
  if (totalCents === 0) {
    if (event.capacity != null) {
      const { data: reserved } = await supabase.rpc("decrement_event_capacity", {
        p_event_id: event.id,
        p_quantity: quantity,
      });
      if (!reserved) {
        await supabase.from("event_tickets").update({ status: "cancelled" }).eq("id", ticket.id);
        throw new Error("This event just sold out.");
      }
    }
    await supabase.from("event_tickets").update({ status: "paid" }).eq("id", ticket.id);
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

  await supabase.from("event_tickets").update({ revolut_order_id: revolutOrderId }).eq("id", ticket.id);

  return { checkoutUrl };
}
