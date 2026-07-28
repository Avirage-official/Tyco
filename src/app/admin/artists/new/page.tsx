import { requireAdmin } from "@/lib/admin/require-admin";
import { ArtistForm } from "../ArtistForm";

export default async function NewArtistPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New artist</h2>
      <ArtistForm />
    </div>
  );
}
