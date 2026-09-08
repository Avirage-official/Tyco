import { requireAdmin } from "@/lib/admin/require-admin";
import { FeedForm } from "../FeedForm";

export default async function NewFeedItemPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New journal item</h2>
      <FeedForm />
    </div>
  );
}
