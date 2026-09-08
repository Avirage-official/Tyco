"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type FeedItemInput = {
  type: "release" | "news";
  title: string;
  body: string | null;
  cover_url: string | null;
  source_url: string | null;
  release_date: string | null;
};

function revalidateFeed() {
  revalidatePath("/admin/feed");
}

export async function createFeedItem(input: FeedItemInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("feed_items").insert({ ...input, discovery: "manual" });
  if (error) throw new Error(error.message);
  revalidateFeed();
}

export async function updateFeedItem(id: string, input: FeedItemInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("feed_items").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFeed();
}

export async function toggleFeedPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("feed_items").update({ is_published: isPublished }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFeed();
}

export async function deleteFeedItem(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("feed_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFeed();
}
