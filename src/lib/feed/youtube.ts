import "server-only";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// The 10 ASEAN member states — the "Southeast Asia" scope for both the
// region rotation below and Claude's classification prompt. Some of these
// (BN, LA) return few or no hits given how thin YouTube's penetration is
// there, but they're included for completeness rather than assumed away.
const SEA_REGION_CODES = ["TH", "VN", "ID", "MY", "PH", "SG", "KH", "LA", "MM", "BN"];

// YouTube's search `q` param supports "|" (OR) and "-" (NOT) as documented
// boolean operators — one call per region covers every keyword instead of
// one call per keyword-per-region, which would blow through the daily
// quota fast. English terms plus native-language equivalents for the
// markets where "official MV" isn't how local uploaders actually title
// things — small/independent artists especially.
const DISCOVERY_QUERY = [
  "official mv",
  "official music video",
  "เพลงใหม่", // Thai: "new song"
  "MV chính thức", // Vietnamese: "official MV"
  "musik resmi", // Indonesian: "official [music]"
].join(" | ");

export type YouTubeCandidate = {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string | null;
  discovery: "curated" | "search";
};

type SearchListItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    description?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
    thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } };
  };
};

function toCandidate(item: SearchListItem, discovery: YouTubeCandidate["discovery"]): YouTubeCandidate | null {
  const videoId = item.id?.videoId;
  const snippet = item.snippet;
  if (!videoId || !snippet?.title || !snippet.channelId || !snippet.publishedAt) return null;
  return {
    videoId,
    title: snippet.title,
    description: snippet.description ?? "",
    channelId: snippet.channelId,
    channelTitle: snippet.channelTitle ?? "Unknown channel",
    publishedAt: snippet.publishedAt,
    thumbnailUrl:
      snippet.thumbnails?.high?.url ?? snippet.thumbnails?.medium?.url ?? snippet.thumbnails?.default?.url ?? null,
    discovery,
  };
}

async function searchList(params: Record<string, string>): Promise<SearchListItem[]> {
  const apiKey = requireEnv("YOUTUBE_API_KEY");
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.search = new URLSearchParams({ part: "snippet", type: "video", key: apiKey, ...params }).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube search.list failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { items?: SearchListItem[] };
  return data.items ?? [];
}

/**
 * Polls a fixed list of channel IDs (set via YOUTUBE_CURATED_CHANNEL_IDS,
 * comma-separated — empty by default) for uploads since `publishedAfter`.
 * The reliable core of discovery, but optional: unlike the region/keyword
 * search below, it only ever finds channels someone has explicitly added,
 * so small/independent artists won't show up here until curated in.
 */
export async function searchCuratedChannels(publishedAfter: Date): Promise<YouTubeCandidate[]> {
  const channelIds = (process.env.YOUTUBE_CURATED_CHANNEL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (channelIds.length === 0) return [];

  const results = await Promise.all(
    channelIds.map((channelId) =>
      searchList({
        channelId,
        order: "date",
        maxResults: "10",
        publishedAfter: publishedAfter.toISOString(),
      }).catch(() => [] as SearchListItem[])
    )
  );

  return results.flat().map((item) => toCandidate(item, "curated")).filter((c): c is YouTubeCandidate => c !== null);
}

/**
 * The primary discovery path per the project's direction: cast a wide net
 * across Southeast Asian region codes with a combined keyword query rather
 * than requiring a hand-picked channel list, since independent artists
 * won't be on anyone's curated playlist. Noisier than the curated path —
 * candidates from here get the "search" discovery tag so Claude's
 * classification (and the admin review screen) can weigh them more
 * carefully. maxResults is 50 (YouTube's per-call maximum) rather than
 * paginating with nextPageToken — the monthly job's ~2-month window needs
 * more headroom per call than the old daily job did, but a second page
 * per region would double the quota cost for a call this runs on a cron.
 */
export async function searchOpenDiscovery(publishedAfter: Date): Promise<YouTubeCandidate[]> {
  const results = await Promise.all(
    SEA_REGION_CODES.map((regionCode) =>
      searchList({
        q: DISCOVERY_QUERY,
        regionCode,
        order: "date",
        maxResults: "50",
        publishedAfter: publishedAfter.toISOString(),
      }).catch(() => [] as SearchListItem[])
    )
  );

  return results.flat().map((item) => toCandidate(item, "search")).filter((c): c is YouTubeCandidate => c !== null);
}

/**
 * Runs both discovery paths and dedupes by video ID — a video can
 * legitimately surface from more than one region query, and a curated
 * channel's upload could also match the open search.
 */
export async function discoverCandidates(publishedAfter: Date): Promise<YouTubeCandidate[]> {
  const [curated, search] = await Promise.all([
    searchCuratedChannels(publishedAfter),
    searchOpenDiscovery(publishedAfter),
  ]);

  const seen = new Map<string, YouTubeCandidate>();
  for (const candidate of [...curated, ...search]) {
    // Curated wins the dedupe if both find the same video — it's the more
    // trusted source, so a duplicate should carry the less-scrutinized tag.
    if (!seen.has(candidate.videoId) || candidate.discovery === "curated") {
      seen.set(candidate.videoId, candidate);
    }
  }
  return Array.from(seen.values());
}
