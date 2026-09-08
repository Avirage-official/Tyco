import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { FeedForm } from "../FeedForm";

export default async function EditFeedItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase
    .from("feed_items")
    .select("id, type, title, body, cover_url, source_url, release_date, discovery, is_english")
    .eq("id", id)
    .single();

  if (!item) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit journal item</h2>
      <FeedForm item={item} />
    </div>
  );
}
