"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type ArtistInput = {
  name: string;
  bio: string | null;
  photo_url: string | null;
};

function revalidateArtists() {
  revalidatePath("/admin/artists");
  revalidatePath("/music");
}

export async function createArtist(input: ArtistInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("artists").insert(input);
  if (error) throw new Error(error.message);
  revalidateArtists();
}

export async function updateArtist(id: string, input: ArtistInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("artists").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateArtists();
}

export async function toggleArtistPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("artists")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateArtists();
}

export async function deleteArtist(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("artists").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateArtists();
}
