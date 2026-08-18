"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type EventInput = {
  title: string;
  description: string | null;
  location: string | null;
  event_date: string;
  cover_url: string | null;
  ticket_url: string | null;
  price_cents: number;
  capacity: number | null;
};

function revalidateEvents() {
  revalidatePath("/admin/events");
  revalidatePath("/studio/events");
}

export async function createEvent(input: EventInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").insert(input);
  if (error) throw new Error(error.message);
  revalidateEvents();
}

export async function updateEvent(id: string, input: EventInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("events").update(input).eq("id", id);
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
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateEvents();
}
