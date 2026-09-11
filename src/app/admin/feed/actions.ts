"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { runFeedSync, type SyncResult } from "@/lib/feed/run-sync";

export type FeedItemInput = {
  type: "release" | "news";
  title: string;
  body: string | null;
  cover_url: string | null;
  source_url: string | null;
  release_date: string | null;
  is_english: boolean;
};

function revalidateFeed() {
  revalidatePath("/admin/feed");
  revalidatePath("/journal");
}

/**
 * Records the source_id(s) of the feed_items rows about to be deleted, so
 * the next sync run knows never to re-discover the same YouTube video —
 * deleting the row also deletes its source_id, and without this the video
 * just looks "new" again next time. Manual entries have no source_id
 * (nothing was auto-discovered), so there's nothing to exclude for those.
 */
async function excludeSources(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], ids: string[]) {
  const { data: rows } = await supabase.from("feed_items").select("source_id").in("id", ids);
  const sourceIds = (rows ?? []).map((row) => row.source_id).filter((id): id is string => id !== null);
  if (sourceIds.length === 0) return;

  const { error } = await supabase
    .from("feed_excluded_sources")
    .upsert(
      sourceIds.map((source_id) => ({ source_id })),
      { onConflict: "source_id", ignoreDuplicates: true }
    );
  if (error) throw new Error(error.message);
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
  await excludeSources(supabase, [id]);
  const { error } = await supabase.from("feed_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateFeed();
}

export async function bulkSetFeedPublished(ids: string[], isPublished: boolean) {
  if (ids.length === 0) return;
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("feed_items").update({ is_published: isPublished }).in("id", ids);
  if (error) throw new Error(error.message);
  revalidateFeed();
}

// Deletes the rows outright from feed_items (Supabase) — not a soft-hide,
// same as the single-item delete above.
export async function bulkDeleteFeedItems(ids: string[]) {
  if (ids.length === 0) return;
  const { supabase } = await requireAdmin();
  await excludeSources(supabase, ids);
  const { error } = await supabase.from("feed_items").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidateFeed();
}

/**
 * Runs the same discover → classify → insert pipeline as the cron route,
 * gated by requireAdmin() instead of CRON_SECRET — lets an admin trigger a
 * sync from the UI without ever touching the secret or devtools.
 */
export async function runFeedSyncNow(): Promise<SyncResult> {
  await requireAdmin();
  const result = await runFeedSync();
  revalidateFeed();
  return result;
}
