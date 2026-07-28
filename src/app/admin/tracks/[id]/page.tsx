import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { TrackForm } from "../TrackForm";

export default async function EditTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: track }, { data: albums }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, title, artist, album_id, cover_url, audio_url, duration_seconds, track_number, release_date")
      .eq("id", id)
      .single(),
    supabase.from("albums").select("id, title").order("title"),
  ]);

  if (!track) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit track</h2>
      <TrackForm track={track} albums={albums ?? []} />
    </div>
  );
}
