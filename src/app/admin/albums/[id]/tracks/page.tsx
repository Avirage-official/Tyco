import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { BulkTrackForm } from "./BulkTrackForm";

export default async function BulkAddTracksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: album }, { data: existingTracks }] = await Promise.all([
    supabase.from("albums").select("id, title, artist_id, cover_url, release_date").eq("id", id).single(),
    supabase.from("tracks").select("track_number").eq("album_id", id),
  ]);

  if (!album) notFound();

  const highestTrackNumber = (existingTracks ?? []).reduce(
    (max, t) => (t.track_number && t.track_number > max ? t.track_number : max),
    0
  );

  return (
    <div>
      <h2 style={{ marginBottom: "0.4rem" }}>Add tracks to “{album.title}”</h2>
      <p style={{ marginBottom: "var(--space-md)", color: "var(--fg-muted)" }}>
        Pick every audio file for this album at once — title and track number are guessed from the
        filename, edit anything before submitting. Cover art, artist, and release date are inherited
        from the album.
      </p>
      <BulkTrackForm album={album} nextTrackNumber={highestTrackNumber + 1} />
    </div>
  );
}
