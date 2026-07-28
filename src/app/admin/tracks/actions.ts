"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type TrackInput = {
  title: string;
  artist_id: string | null;
  album_id: string | null;
  cover_url: string | null;
  audio_url: string;
  duration_seconds: number | null;
  track_number: number | null;
  release_date: string | null;
};

function revalidateTracks() {
  revalidatePath("/admin/tracks");
  revalidatePath("/music");
}

export async function createTrack(input: TrackInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("tracks").insert(input);
  if (error) throw new Error(error.message);
  revalidateTracks();
}

export async function createTracksBulk(inputs: TrackInput[]) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("tracks").insert(inputs);
  if (error) throw new Error(error.message);
  revalidateTracks();
  revalidatePath("/admin/albums");
}

export async function updateTrack(id: string, input: TrackInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("tracks").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTracks();
}

export async function toggleTrackPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("tracks")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTracks();
}

export async function deleteTrack(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("tracks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateTracks();
}
