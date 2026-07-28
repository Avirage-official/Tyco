import { requireAdmin } from "@/lib/admin/require-admin";
import { TrackForm } from "../TrackForm";

export default async function NewTrackPage() {
  const { supabase } = await requireAdmin();
  const [{ data: albums }, { data: artists }] = await Promise.all([
    supabase.from("albums").select("id, title").order("title"),
    supabase.from("artists").select("id, name").order("name"),
  ]);

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New track</h2>
      <TrackForm albums={albums ?? []} artists={artists ?? []} />
    </div>
  );
}
