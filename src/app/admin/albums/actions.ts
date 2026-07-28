"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type AlbumInput = {
  title: string;
  cover_url: string | null;
  release_date: string | null;
};

function revalidateAlbums() {
  revalidatePath("/admin/albums");
  revalidatePath("/music");
}

export async function createAlbum(input: AlbumInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("albums").insert(input);
  if (error) throw new Error(error.message);
  revalidateAlbums();
}

export async function updateAlbum(id: string, input: AlbumInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("albums").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAlbums();
}

export async function toggleAlbumPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("albums")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAlbums();
}

export async function deleteAlbum(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("albums").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateAlbums();
}
