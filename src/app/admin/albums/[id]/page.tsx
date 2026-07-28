import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { AlbumForm } from "../AlbumForm";

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: album }, { data: artists }] = await Promise.all([
    supabase.from("albums").select("id, title, artist_id, cover_url, release_date").eq("id", id).single(),
    supabase.from("artists").select("id, name").order("name"),
  ]);

  if (!album) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit album</h2>
      <AlbumForm album={album} artists={artists ?? []} />
    </div>
  );
}
