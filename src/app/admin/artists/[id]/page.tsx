import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ArtistForm } from "../ArtistForm";

export default async function EditArtistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: artist } = await supabase
    .from("artists")
    .select("id, name, bio, photo_url")
    .eq("id", id)
    .single();

  if (!artist) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit artist</h2>
      <ArtistForm artist={artist} />
    </div>
  );
}
