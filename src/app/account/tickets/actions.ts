"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRevolutOrder } from "@/lib/checkout/revolut";
import { DENIAL_REASONS, REVERSAL_REASONS } from "@/lib/tickets/doorReasons";

/**
 * Re-issues a Revolut payment link for a ticket that's still pending —
 * e.g. the buyer closed the tab before paying. Reuses the same ticket row
 * (same id, same reference code) rather than creating a new one: only
 * revolut_order_id changes, so the payment webhook (which matches purely
 * by that id) picks up the new attempt without any change on its side.
 *
 * Only works within the window a pending ticket actually survives —
 * expire_stale_event_tickets (swept on the tickets page's own load)
 * already cancels anything left pending past 12 hours, at which point
 * the status check below correctly refuses rather than resurrecting a
 * dead ticket.
 */
export async function resumeTicketCheckout(ticketId: string) {
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) throw new Error("Sign in to continue.");

  const supabase = createAdminClient();

  const { data: ticket, error: ticketError } = await supabase
    .from("event_tickets")
    .select("id, user_id, event_id, total_cents, currency, status")
    .eq("id", ticketId)
    .single();
  if (ticketError || !ticket || ticket.user_id !== user.id) {
    throw new Error("Ticket not found.");
  }
  if (ticket.status !== "pending") {
    throw new Error("This ticket isn't awaiting payment.");
  }
  if (ticket.total_cents === 0) {
    throw new Error("This ticket doesn't need payment.");
  }

  // Time has passed since the original attempt — re-check the same things
  // startTicketCheckout did rather than trusting the ticket's own snapshot.
  // Capacity itself is deliberately not re-checked here: it's only ever
  // enforced atomically at actual payment confirmation (same as a fresh
  // purchase), not at checkout-start time.
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, is_published, event_date")
    .eq("id", ticket.event_id)
    .single();
  if (eventError || !event || !event.is_published) {
    throw new Error("This event is no longer available.");
  }
  if (new Date(event.event_date).getTime() < Date.now()) {
    throw new Error("This event has already happened.");
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`;

  const { checkoutUrl, revolutOrderId } = await createRevolutOrder({
    amountCents: ticket.total_cents,
    currency: ticket.currency,
    orderId: `ticket:${ticket.id}`,
    redirectUrl: `${origin}/account/tickets?ticket=${ticket.id}`,
  });

  await supabase.from("event_tickets").update({ revolut_order_id: revolutOrderId }).eq("id", ticket.id);

  return { checkoutUrl };
}

function validateReasons(reasons: string[], allowed: readonly string[]) {
  if (reasons.length === 0) throw new Error("Choose at least one reason.");
  if (!reasons.every((reason) => allowed.includes(reason))) {
    throw new Error("Choose a reason from the list.");
  }
}

/**
 * The door flow: the ticket holder shows their own (already signed-in)
 * ticket page to venue staff, who have no Tyco account of their own —
 * there's nothing to authenticate them against, so they just type their
 * name and tap a decision. Ownership is re-checked inside the RPC itself
 * (user_id = auth.uid()), not just assumed from this page being reachable
 * only by the ticket's owner.
 */
export async function approveTicketCheckIn(ticketId: string, staffName: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_ticket_checkin", {
    p_ticket_id: ticketId,
    p_staff_name: staffName,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/tickets");
  return data;
}

export async function denyTicketCheckIn(ticketId: string, staffName: string, reasons: string[]) {
  validateReasons(reasons, DENIAL_REASONS);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("deny_ticket_checkin", {
    p_ticket_id: ticketId,
    p_staff_name: staffName,
    p_reasons: reasons,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/tickets");
  return data;
}

export async function reverseTicketDenial(ticketId: string, staffName: string, reasons: string[]) {
  validateReasons(reasons, REVERSAL_REASONS);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reverse_ticket_denial", {
    p_ticket_id: ticketId,
    p_staff_name: staffName,
    p_reasons: reasons,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/tickets");
  return data;
}
