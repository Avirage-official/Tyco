"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

/**
 * Same check_in_ticket RPC the door check-in page uses — this just gives
 * staff a one-click way to check someone in straight from the ticket list
 * when they can already see the right row, instead of having to retype
 * the reference code into the lookup form.
 */
export async function checkInTicketFromList(ticketId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("check_in_ticket", { p_ticket_id: ticketId });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/tickets");
}

/**
 * Organizer-approved refund only — there's no self-serve refund for buyers.
 * Marks the ticket refunded and gives the pax back to the event's capacity
 * (the actual money still has to be refunded manually in Revolut; this just
 * keeps our own records and the door capacity in sync with that decision).
 */
export async function refundTicket(ticketId: string) {
  const { supabase } = await requireAdmin();

  const { data: ticket, error: ticketError } = await supabase
    .from("event_tickets")
    .select("id, event_id, quantity, status")
    .eq("id", ticketId)
    .single();
  if (ticketError || !ticket) throw new Error(ticketError?.message ?? "Ticket not found.");
  if (ticket.status !== "paid") throw new Error("Only paid tickets can be refunded.");

  const { error: statusError } = await supabase
    .from("event_tickets")
    .update({ status: "refunded" })
    .eq("id", ticketId)
    .eq("status", "paid");
  if (statusError) throw new Error(statusError.message);

  await supabase.rpc("restore_event_capacity", { p_event_id: ticket.event_id, p_quantity: ticket.quantity });

  revalidatePath("/admin/tickets");
  revalidatePath("/admin/events");
  revalidatePath("/happenings");
  revalidatePath("/happenings/[id]", "page");
}
