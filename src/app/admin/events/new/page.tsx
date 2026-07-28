import { requireAdmin } from "@/lib/admin/require-admin";
import { EventForm } from "../EventForm";

export default async function NewEventPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New event</h2>
      <EventForm />
    </div>
  );
}
