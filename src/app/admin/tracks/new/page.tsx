import { requireAdmin } from "@/lib/admin/require-admin";
import { TrackForm } from "../TrackForm";

export default async function NewTrackPage() {
  const { supabase } = await requireAdmin();
  const { data: albums } = await supabase.from("albums").select("id, title").order("title");

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New track</h2>
      <TrackForm albums={albums ?? []} />
    </div>
  );
}
