import "server-only";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

// Up to 2 pages of 50 results (100 total) per term — with 14 terms now run
// separately (see DISCOVERY_TERMS below) this is already ~28 calls/run
// (2800 quota units), so kept a notch more conservative per-term than the
// single-query version was. Still comfortably under the 10,000/day free
// quota for a monthly cron.
const MAX_SEARCH_PAGES = 2;

// Each term runs as its own plain search rather than one query combining
// them with YouTube's documented "|" (OR) operator — a run using the
// combined-OR query returned almost nothing (1 candidate) even after
// dropping the regionCode restriction that should have only ever
// broadened results, never narrowed them. That's a strong sign the "|"
// operator doesn't behave the way the docs describe once phrases have
// more than one word each, and there's no way to verify the exact
// parsing behavior from outside a live query. A plain single-phrase
// search is YouTube's best-understood, most standard behavior — no
// operator syntax left to get wrong — so each term below gets searched
// independently and the results are merged (same dedup-by-video-ID logic
// already used to merge the curated and open-search paths).
//
// Deliberately broad on the English side — "official mv" alone missed
// most real uploads, which use "Official Video," "Official Audio," "M/V,"
// or no distinctive phrase at all — plus native-language terms for
// markets where uploaders (small/independent artists especially) don't
// title things in English. Casting a wider net here is the correct
// tradeoff: Claude's classification step is the actual quality gate
// (conservative by design — see classify.ts), not this query. No
// regionCode restriction — it turned out to filter by "viewable in this
// country" (almost never excludes anything) rather than "uploaded from
// this country," so rotating through region codes was mostly running the
// same search repeatedly rather than actually covering more ground.
// Claude judges "genuinely Asian" from the video's real title/channel/
// description instead — the thing regionCode was never actually doing.
//
// Scope is all of Asia, not just Southeast Asia — East and South Asia
// (Korea, Japan, Greater China, India) are in too, each with at least one
// native-language term below for the same independent/small-artist reason
// as the Southeast Asian terms. English is never filtered on: Claude tags
// each relevant candidate as English or not (see classify.ts) rather than
// rejecting non-English candidates, since most of the region's
// independent scene doesn't release in English at all.
const DISCOVERY_TERMS = [
  "official mv",
  "official music video",
  "official video",
  "official audio",
  "m/v",
  "เพลงใหม่", // Thai: "new song"
  "MV chính thức", // Vietnamese: "official MV"
  "musik resmi", // Indonesian: "official [music]"
  "lagu baru", // Indonesian: "new song"
  "신곡", // Korean: "new song"
  "新曲", // Japanese: "new song"
  "官方MV", // Mandarin: "official MV"
  "新歌", // Mandarin: "new song"
  "नया गाना", // Hindi: "new song"
];

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

type SearchListPage = { items: SearchListItem[]; nextPageToken?: string };

async function searchList(params: Record<string, string>): Promise<SearchListPage> {
  const apiKey = requireEnv("YOUTUBE_API_KEY");
  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.search = new URLSearchParams({ part: "snippet", type: "video", key: apiKey, ...params }).toString();

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube search.list failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { items?: SearchListItem[]; nextPageToken?: string };
  return { items: data.items ?? [], nextPageToken: data.nextPageToken };
}

/** Walks up to `maxPages` pages of search.list via nextPageToken, stopping early once a page comes back short of a full maxResults (no more results left). */
async function searchListAllPages(
  params: Record<string, string>,
  maxPages: number
): Promise<SearchListItem[]> {
  const items: SearchListItem[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const { items: pageItems, nextPageToken } = await searchList(
      pageToken ? { ...params, pageToken } : params
    );
    items.push(...pageItems);
    if (!nextPageToken || pageItems.length < Number(params.maxResults ?? 50)) break;
    pageToken = nextPageToken;
  }
  return items;
}

type DiscoveryResult = { candidates: YouTubeCandidate[]; errors: string[] };

/**
 * Polls a fixed list of channel IDs (set via YOUTUBE_CURATED_CHANNEL_IDS,
 * comma-separated — empty by default) for uploads since `publishedAfter`.
 * The reliable core of discovery, but optional: unlike the open keyword
 * search below, it only ever finds channels someone has explicitly added,
 * so small/independent artists won't show up here until curated in.
 */
export async function searchCuratedChannels(publishedAfter: Date): Promise<DiscoveryResult> {
  const channelIds = (process.env.YOUTUBE_CURATED_CHANNEL_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (channelIds.length === 0) return { candidates: [], errors: [] };

  const errors: string[] = [];
  const results = await Promise.all(
    channelIds.map((channelId) =>
      searchList({
        channelId,
        order: "date",
        maxResults: "10",
        publishedAfter: publishedAfter.toISOString(),
      })
        .then((page) => page.items)
        .catch((err) => {
          errors.push(`channel ${channelId}: ${err instanceof Error ? err.message : String(err)}`);
          return [] as SearchListItem[];
        })
    )
  );

  const candidates = results
    .flat()
    .map((item) => toCandidate(item, "curated"))
    .filter((c): c is YouTubeCandidate => c !== null);
  return { candidates, errors };
}

/**
 * The primary discovery path per the project's direction: cast a wide net
 * with plain keyword searches rather than requiring a hand-picked channel
 * list, since independent artists won't be on anyone's curated playlist.
 * Each term in DISCOVERY_TERMS runs as its own separate, plain search (no
 * region restriction — see the DISCOVERY_TERMS comment above for why, and
 * for why this is separate single-term searches rather than one combined
 * "|"-joined query), walking up to MAX_SEARCH_PAGES pages each so the
 * ~2-month window gets more than one page's worth of results per term.
 * Results are merged and deduped by video ID. Noisier than the curated
 * path — candidates from here get the "search" discovery tag so Claude's
 * classification (and the admin review screen) can weigh them more
 * carefully.
 *
 * A failure on any one term's search is caught and recorded rather than
 * silently dropped, and doesn't stop the other terms from running — a run
 * that comes back with almost nothing found needs to be distinguishable
 * from a run where searches actually failed.
 */
export async function searchOpenDiscovery(publishedAfter: Date): Promise<DiscoveryResult> {
  const errors: string[] = [];
  const results = await Promise.all(
    DISCOVERY_TERMS.map((term) =>
      searchListAllPages(
        {
          q: term,
          order: "date",
          maxResults: "50",
          publishedAfter: publishedAfter.toISOString(),
        },
        MAX_SEARCH_PAGES
      ).catch((err) => {
        errors.push(`term "${term}": ${err instanceof Error ? err.message : String(err)}`);
        return [] as SearchListItem[];
      })
    )
  );

  const candidates = results
    .flat()
    .map((item) => toCandidate(item, "search"))
    .filter((c): c is YouTubeCandidate => c !== null);
  return { candidates, errors };
}

/**
 * Runs both discovery paths and dedupes by video ID — a video could
 * legitimately surface from a curated channel's upload also matching the
 * open search.
 */
export async function discoverCandidates(publishedAfter: Date): Promise<DiscoveryResult> {
  const [curated, search] = await Promise.all([
    searchCuratedChannels(publishedAfter),
    searchOpenDiscovery(publishedAfter),
  ]);

  const seen = new Map<string, YouTubeCandidate>();
  for (const candidate of [...curated.candidates, ...search.candidates]) {
    // Curated wins the dedupe if both find the same video — it's the more
    // trusted source, so a duplicate should carry the less-scrutinized tag.
    if (!seen.has(candidate.videoId) || candidate.discovery === "curated") {
      seen.set(candidate.videoId, candidate);
    }
  }
  return { candidates: Array.from(seen.values()), errors: [...curated.errors, ...search.errors] };
}
