import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { discoverCandidates } from "@/lib/feed/youtube";
import { classifyCandidates } from "@/lib/feed/classify";

// Daily is the cadence (see vercel.json), but the window is wider than a
// day — a real "official MV" upload in this exact region+keyword slice
// isn't guaranteed every single day, and a wider window has no downside:
// new candidates are always filtered against feed_items.source_id below
// before anything gets classified or inserted, so scanning further back
// just means seeing (and skipping) more already-known videos, not
// re-inserting them.
const LOOKBACK_DAYS = 7;

/**
 * Pulls new YouTube candidates (curated channels + open Southeast Asia
 * search), has Claude classify/draft the relevant ones, and inserts them
 * into feed_items as unpublished drafts for /admin/feed to review. Nothing
 * this route does ever sets is_published — that's a human decision, made
 * in the admin screen.
 *
 * Protected by CRON_SECRET: Vercel sends `Authorization: Bearer
 * <CRON_SECRET>` automatically on its own scheduled invocations (see
 * vercel.json) once the env var is set, so nobody else can trigger this by
 * finding the URL.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const publishedAfter = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const candidates = await discoverCandidates(publishedAfter);

    if (candidates.length === 0) {
      return NextResponse.json({ candidatesFound: 0, newCandidates: 0, inserted: 0 });
    }

    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("feed_items")
      .select("source_id")
      .in(
        "source_id",
        candidates.map((c) => c.videoId)
      );
    const seenIds = new Set((existing ?? []).map((row) => row.source_id));
    const newCandidates = candidates.filter((c) => !seenIds.has(c.videoId));

    if (newCandidates.length === 0) {
      return NextResponse.json({ candidatesFound: candidates.length, newCandidates: 0, inserted: 0 });
    }

    const classified = await classifyCandidates(newCandidates);
    const toInsert = classified
      .filter((c) => c.relevant)
      .map((c) => ({
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
      }));

    if (toInsert.length > 0) {
      const { error } = await supabase
        .from("feed_items")
        .upsert(toInsert, { onConflict: "source_id", ignoreDuplicates: true });
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({
      candidatesFound: candidates.length,
      newCandidates: newCandidates.length,
      classified: classified.length,
      inserted: toInsert.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("feed-sync failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
