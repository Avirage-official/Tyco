import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { CreatorForm } from "../CreatorForm";

export default async function EditCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: creator }, { data: works }, { data: noteRow }] = await Promise.all([
    supabase
      .from("creators")
      .select(
        "id, slug, name, type, tagline, bio, location, website_url, instagram_url, tiktok_url, youtube_url, spotify_url, avatar_url, banner_url, gallery, tags, is_featured"
      )
      .eq("id", id)
      .single(),
    supabase
      .from("creator_works")
      .select("title, description, cover_url, external_url")
      .eq("creator_id", id)
      .order("display_order", { ascending: true }),
    supabase.from("creator_admin_notes").select("notes").eq("creator_id", id).maybeSingle(),
  ]);

  if (!creator) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit creator</h2>
      <CreatorForm creator={creator} works={works ?? []} notes={noteRow?.notes ?? ""} />
    </div>
  );
}
