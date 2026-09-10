import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { YouTubeCandidate } from "./youtube";

// Cheap, high-volume classification + short drafting — not a task that
// benefits from a larger model, and the daily batch size (tens of
// candidates) keeps this well under a dollar a month either way.
const MODEL = "claude-haiku-4-5-20251001";

const ClassificationResult = z.object({
  video_id: z.string(),
  relevant: z.boolean(),
  reason: z.string(),
  type: z.enum(["release", "news"]),
  blurb: z.string().nullable(),
  is_english: z.boolean(),
});

const ClassificationSchema = z.object({
  results: z.array(ClassificationResult),
});

export type ClassifiedCandidate = {
  candidate: YouTubeCandidate;
  relevant: boolean;
  reason: string;
  type: "release" | "news";
  blurb: string | null;
  isEnglish: boolean;
};

// The only thing standing between a noisy YouTube search and what lands as
// a draft in /admin/feed — the instruction to never state a fact the input
// doesn't support is the load-bearing line here, same discipline as every
// other AI-touched surface on this site (no invented specs, no fabricated
// data).
const SYSTEM_PROMPT = `You are screening YouTube search results for Tyco, a Southeast Asia-rooted creative collective's website. Your job: decide which candidates are genuinely a real, current music release or creative-scene news item from an Asian artist, label, or creative (any country — East, South, and Southeast Asia are all in scope) — and draft a short (1-2 sentence) blurb for each one that passes, using ONLY the title, channel name, and description text given to you.

Reject anything that is: a cover, reaction, remix, or fan compilation rather than an original release; a re-upload, lyric-video repost, or clearly unofficial upload; not actually tied to an Asian artist/scene despite matching a search keyword; spam, unrelated content, or too vague to confirm.

Never state a fact in the blurb that isn't directly supported by the title/channel/description you were given — no invented release dates, no guessed genre or backstory, no claims about chart performance or popularity unless the text says so. If you aren't sure a candidate is genuine or Asian, mark it not relevant rather than guessing.

For every relevant candidate, also set is_english: true if the song/content itself is in English, false otherwise (including instrumental, or any other language). This is a tag, not a filter — non-English candidates are just as valid a pass as English ones; don't let language affect the relevant decision.

Classify every candidate in the input, in the same order given, exactly one result per video_id.`;

function buildUserPrompt(candidates: YouTubeCandidate[]) {
  const items = candidates.map((c) => ({
    video_id: c.videoId,
    title: c.title,
    channel: c.channelTitle,
    description: c.description.slice(0, 500),
    published_at: c.publishedAt,
    discovery: c.discovery,
  }));
  return `Candidates (discovery: "curated" = a channel we already follow, "search" = found via open keyword search and needs more scrutiny before you call it relevant):\n\n${JSON.stringify(items, null, 2)}`;
}

// A single request holding every candidate blew past the API's prompt-length
// limit once Asia-wide discovery started actually returning volume (~1,400
// candidates in one run measured ~217k prompt tokens against a 20k cap) — so
// candidates are split into chunks well under that ceiling (a chunk this
// size runs a few thousand tokens at most, comfortable margin) and each
// chunk is its own request.
const MAX_CANDIDATES_PER_CALL = 40;
// Bounds how many chunk requests run at once, so a large backlog fans out
// for speed without firing dozens of concurrent Anthropic requests at once.
const MAX_CONCURRENT_CALLS = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size));
  return chunks;
}

/**
 * Sends one chunk to Claude in a single call — cheaper and simpler than one
 * call per video, and lets the model weigh candidates in the same chunk
 * against each other (e.g. spotting a repost of something else in the
 * batch). Returns only candidates Claude actually echoed a matching
 * video_id for; anything else is dropped rather than trusted.
 */
async function classifyChunk(client: Anthropic, candidates: YouTubeCandidate[]): Promise<ClassifiedCandidate[]> {
  const byId = new Map(candidates.map((c) => [c.videoId, c]));

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(candidates) }],
    output_config: { format: zodOutputFormat(ClassificationSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) return [];

  const out: ClassifiedCandidate[] = [];
  for (const result of parsed.results) {
    const candidate = byId.get(result.video_id);
    if (!candidate) continue;
    out.push({
      candidate,
      relevant: result.relevant,
      reason: result.reason,
      type: result.type,
      blurb: result.blurb,
      isEnglish: result.is_english,
    });
  }
  return out;
}

/**
 * `onBatch`, if given, is awaited after each wave of chunk requests
 * completes — the cron route uses it to upsert results incrementally, so a
 * large backlog that runs long enough to hit the function's time limit
 * still saves whatever was classified before that point, instead of
 * losing a wave of completed (and already paid-for) Claude calls to an
 * all-or-nothing insert at the very end.
 */
export async function classifyCandidates(
  candidates: YouTubeCandidate[],
  onBatch?: (batch: ClassifiedCandidate[]) => Promise<void> | void
): Promise<ClassifiedCandidate[]> {
  if (candidates.length === 0) return [];

  const client = new Anthropic();
  const chunks = chunk(candidates, MAX_CANDIDATES_PER_CALL);

  const results: ClassifiedCandidate[] = [];
  for (let i = 0; i < chunks.length; i += MAX_CONCURRENT_CALLS) {
    const wave = chunks.slice(i, i + MAX_CONCURRENT_CALLS);
    const waveResults = (await Promise.all(wave.map((c) => classifyChunk(client, c)))).flat();
    results.push(...waveResults);
    if (onBatch) await onBatch(waveResults);
  }
  return results;
}
