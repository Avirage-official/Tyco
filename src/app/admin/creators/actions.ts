"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import type { AboutSlide, CreatorType } from "@/lib/supabase/types";

export type CreatorInput = {
  slug: string;
  name: string;
  type: CreatorType;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  gallery: AboutSlide[];
  tags: string[];
  is_featured: boolean;
};

export type WorkInput = {
  title: string;
  description: string | null;
  cover_url: string | null;
  external_url: string | null;
};

function revalidateCreators() {
  revalidatePath("/admin/creators");
}

async function replaceWorks(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  creatorId: string,
  works: WorkInput[]
) {
  await supabase.from("creator_works").delete().eq("creator_id", creatorId);
  const rows = works
    .filter((w) => w.title.trim().length > 0)
    .map((w, i) => ({
      creator_id: creatorId,
      title: w.title.trim(),
      description: w.description,
      cover_url: w.cover_url,
      external_url: w.external_url,
      display_order: i,
      is_published: true,
    }));
  if (rows.length > 0) {
    const { error } = await supabase.from("creator_works").insert(rows);
    if (error) throw new Error(error.message);
  }
}

async function saveNotes(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  creatorId: string,
  notes: string
) {
  const { error } = await supabase
    .from("creator_admin_notes")
    .upsert({ creator_id: creatorId, notes: notes.trim() || null });
  if (error) throw new Error(error.message);
}

export async function createCreator(input: CreatorInput, works: WorkInput[], notes: string) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("creators").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  await replaceWorks(supabase, data.id, works);
  await saveNotes(supabase, data.id, notes);
  revalidateCreators();
  return data.id;
}

export async function updateCreator(id: string, input: CreatorInput, works: WorkInput[], notes: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("creators").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  await replaceWorks(supabase, id, works);
  await saveNotes(supabase, id, notes);
  revalidateCreators();
}

export async function toggleCreatorPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("creators").update({ is_published: isPublished }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateCreators();
}

export async function deleteCreator(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("creators").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateCreators();
}
