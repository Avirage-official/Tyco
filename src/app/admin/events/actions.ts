"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { deleteStorageUrls } from "@/lib/supabase/storage-cleanup";

export type EventInput = {
  title: string;
  description: string | null;
  location: string | null;
  organizer: string | null;
  event_date: string;
  cover_url: string | null;
  cover_video_url: string | null;
  ticket_url: string | null;
  price_cents: number;
  capacity: number | null;
};

function revalidateEvents() {
  revalidatePath("/admin/events");
  revalidatePath("/studio");
}

// Single-currency site — SGD, not exposed as a form field.
const EVENT_CURRENCY = "sgd";

export async function createEvent(input: EventInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").insert({ ...input, currency: EVENT_CURRENCY });
  if (error) throw new Error(error.message);
  revalidateEvents();
}

export async function updateEvent(id: string, input: EventInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("events")
    .update({ ...input, currency: EVENT_CURRENCY })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateEvents();
}

export async function toggleEventPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("events")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateEvents();
}

export async function deleteEvent(id: string) {
  const { supabase } = await requireAdmin();

  // event_tickets cascades on event delete — block instead of silently
  // wiping purchase and check-in history for an event that sold tickets.
  const { count } = await supabase
    .from("event_tickets")
    .select("*", { count: "exact", head: true })
    .eq("event_id", id);
  if (count && count > 0) {
    throw new Error(
      `Can't delete — ${count} ticket(s) were sold for this event. Unpublish it instead to keep the record.`
    );
  }

  const { data: eventRow } = await supabase
    .from("events")
    .select("cover_url, cover_video_url")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (eventRow) {
    await deleteStorageUrls(supabase, "covers", [eventRow.cover_url, eventRow.cover_video_url]);
  }

  revalidateEvents();
}
