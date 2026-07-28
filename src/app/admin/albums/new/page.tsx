import { requireAdmin } from "@/lib/admin/require-admin";
import { AlbumForm } from "../AlbumForm";

export default async function NewAlbumPage() {
  const { supabase } = await requireAdmin();
  const { data: artists } = await supabase.from("artists").select("id, name").order("name");

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New album</h2>
      <AlbumForm artists={artists ?? []} />
    </div>
  );
}
