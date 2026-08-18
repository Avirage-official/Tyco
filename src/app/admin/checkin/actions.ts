"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export type TicketLookup = {
  id: string;
  quantity: number;
  status: string;
  checked_in_at: string | null;
  eventTitle: string;
  eventDate: string;
};

export async function lookupTicket(code: string): Promise<TicketLookup | null> {
  const { supabase } = await requireAdmin();
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data: ticket } = await supabase
    .from("event_tickets")
    .select("id, quantity, status, checked_in_at, event_id")
    .eq("reference_code", normalized)
    .maybeSingle();

  if (!ticket) return null;

  const { data: event } = await supabase
    .from("events")
    .select("title, event_date")
    .eq("id", ticket.event_id)
    .maybeSingle();

  return {
    id: ticket.id,
    quantity: ticket.quantity,
    status: ticket.status,
    checked_in_at: ticket.checked_in_at,
    eventTitle: event?.title ?? "Event",
    eventDate: event?.event_date ?? "",
  };
}

export async function checkInTicket(ticketId: string): Promise<TicketLookup> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("check_in_ticket", { p_ticket_id: ticketId });
  if (error || !data) throw new Error(error?.message ?? "Could not check in this ticket.");

  const { data: event } = await supabase
    .from("events")
    .select("title, event_date")
    .eq("id", data.event_id)
    .maybeSingle();

  return {
    id: data.id,
    quantity: data.quantity,
    status: data.status,
    checked_in_at: data.checked_in_at,
    eventTitle: event?.title ?? "Event",
    eventDate: event?.event_date ?? "",
  };
}
