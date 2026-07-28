import { requireAdmin } from "@/lib/admin/require-admin";
import { AlbumForm } from "../AlbumForm";

export default async function NewAlbumPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New album</h2>
      <AlbumForm />
    </div>
  );
}
