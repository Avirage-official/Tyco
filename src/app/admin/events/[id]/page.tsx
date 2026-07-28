import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { EventForm } from "../EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, location, event_date, cover_url, ticket_url")
    .eq("id", id)
    .single();

  if (!event) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit event</h2>
      <EventForm event={event} />
    </div>
  );
}
