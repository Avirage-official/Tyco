import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { discoverCandidates } from "@/lib/feed/youtube";
import { classifyCandidates } from "@/lib/feed/classify";

// Monthly is the cadence (see vercel.json), sweeping the current and
// previous calendar month every run — e.g. a run in September covers
// August 1st onward. That one-month overlap between consecutive runs is
// the buffer against a missed run, same idea as the old daily job's
// few-day buffer, just scaled up. It has no downside: new candidates are
// always filtered against feed_items.source_id (and feed_excluded_sources,
// see below) before anything gets classified or inserted, so re-scanning
// the overlap just means seeing (and skipping) already-known videos, not
// re-inserting them.
const LOOKBACK_MONTHS = 2;

// Caps how many new candidates get classified in a single run. Even
// batched (see classify.ts), classifying a very large one-off backlog —
// e.g. the first run after widening discovery to all of Asia, which found
// on the order of 1,400 new candidates — takes longer than fits in a
// serverless function's time budget. Rather than try to raise that ceiling
// further, cap the work per run: leftover candidates are simply still
// "new" (not yet in feed_items) on the next run, so a backlog above this
// cap drains steadily over a few runs instead of needing to complete in
// one shot.
const MAX_CANDIDATES_PER_RUN = 300;

function lookbackStart(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (LOOKBACK_MONTHS - 1), 1));
}

export type SyncResult = {
  candidatesFound: number;
  newCandidates: number;
  processed?: number;
  remaining?: number;
  classified?: number;
  inserted: number;
  discoveryErrors: string[];
};

/**
 * Pulls new YouTube candidates (curated channels + open Asia-wide search),
 * has Claude classify/draft the relevant ones, and inserts them into
 * feed_items as unpublished drafts for /admin/feed to review. Nothing this
 * ever does sets is_published — that's a human decision, made in the admin
 * screen.
 *
 * Shared by the cron route (`/api/cron/feed-sync`, authenticated via
 * CRON_SECRET) and the admin "Run sync now" action (authenticated via
 * requireAdmin()) — same work either way, just a different caller and a
 * different gate in front of it.
 */
export async function runFeedSync(): Promise<SyncResult> {
  const { candidates, errors: discoveryErrors } = await discoverCandidates(lookbackStart());

  if (candidates.length === 0) {
    return { candidatesFound: 0, newCandidates: 0, inserted: 0, discoveryErrors };
  }

  const supabase = createAdminClient();
  const candidateIds = candidates.map((c) => c.videoId);

  // A video excluded here was deliberately deleted from feed_items by an
  // admin — deleting the row also deletes its source_id, so without this
  // check the next run would see that same video as "new" again and
  // re-discover the exact thing that was rejected.
  const [{ data: existing }, { data: excluded }] = await Promise.all([
    supabase.from("feed_items").select("source_id").in("source_id", candidateIds),
    supabase.from("feed_excluded_sources").select("source_id").in("source_id", candidateIds),
  ]);
  const seenIds = new Set([
    ...(existing ?? []).map((row) => row.source_id),
    ...(excluded ?? []).map((row) => row.source_id),
  ]);
  const newCandidates = candidates.filter((c) => !seenIds.has(c.videoId));

  if (newCandidates.length === 0) {
    return { candidatesFound: candidates.length, newCandidates: 0, inserted: 0, discoveryErrors };
  }

  function toFeedRow(c: Awaited<ReturnType<typeof classifyCandidates>>[number]) {
    return {
      type: c.type,
      title: c.candidate.title,
      body: c.blurb,
      cover_url: c.candidate.thumbnailUrl,
      source_url: `https://www.youtube.com/watch?v=${c.candidate.videoId}`,
      source_id: c.candidate.videoId,
      source_channel: c.candidate.channelTitle,
      discovery: c.candidate.discovery,
      release_date: c.candidate.publishedAt,
      is_published: false,
      is_english: c.isEnglish,
    };
  }

  const toProcess = newCandidates.slice(0, MAX_CANDIDATES_PER_RUN);

  let inserted = 0;
  // Inserting after each classification wave (rather than once at the
  // very end) means a run that hits the time budget partway through still
  // keeps whatever was classified before the cutoff.
  const classified = await classifyCandidates(toProcess, async (batch) => {
    const toInsert = batch.filter((c) => c.relevant).map(toFeedRow);
    if (toInsert.length === 0) return;
    const { error } = await supabase
      .from("feed_items")
      .upsert(toInsert, { onConflict: "source_id", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    inserted += toInsert.length;
  });

  return {
    candidatesFound: candidates.length,
    newCandidates: newCandidates.length,
    processed: toProcess.length,
    remaining: newCandidates.length - toProcess.length,
    classified: classified.length,
    inserted,
    discoveryErrors,
  };
}
