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
};

// The only thing standing between a noisy YouTube search and what lands as
// a draft in /admin/feed — the instruction to never state a fact the input
// doesn't support is the load-bearing line here, same discipline as every
// other AI-touched surface on this site (no invented specs, no fabricated
// data).
const SYSTEM_PROMPT = `You are screening YouTube search results for Tyco, a Southeast Asia-rooted creative collective's website. Your job: decide which candidates are genuinely a real, current music release or creative-scene news item from a Southeast Asian artist, label, or creative — and draft a short (1-2 sentence) blurb for each one that passes, using ONLY the title, channel name, and description text given to you.

Reject anything that is: a cover, reaction, remix, or fan compilation rather than an original release; a re-upload, lyric-video repost, or clearly unofficial upload; not actually tied to a Southeast Asian artist/scene despite matching a search keyword; spam, unrelated content, or too vague to confirm.

Never state a fact in the blurb that isn't directly supported by the title/channel/description you were given — no invented release dates, no guessed genre or backstory, no claims about chart performance or popularity unless the text says so. If you aren't sure a candidate is genuine or Southeast Asian, mark it not relevant rather than guessing.

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

/**
 * Sends the whole candidate batch to Claude in one call — cheaper and
 * simpler than one call per video, and lets the model weigh candidates
 * against each other (e.g. spotting a repost of something else in the
 * same batch). Returns only candidates Claude actually echoed a matching
 * video_id for; anything else is dropped rather than trusted.
 */
export async function classifyCandidates(candidates: YouTubeCandidate[]): Promise<ClassifiedCandidate[]> {
  if (candidates.length === 0) return [];

  const client = new Anthropic();
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
    });
  }
  return out;
}
