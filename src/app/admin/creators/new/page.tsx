import { requireAdmin } from "@/lib/admin/require-admin";
import { CreatorForm } from "../CreatorForm";

export default async function NewCreatorPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New creator</h2>
      <CreatorForm />
    </div>
  );
}
