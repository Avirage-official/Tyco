/**
 * Shared shaping for release tiles. Not "server-only": the Listen rail is a
 * client component and needs the same title cleaning and colour assignment
 * the server used, so both sides agree on what a tile says and looks like.
 */

/**
 * Saturated enough to carry a whole tile, warm enough to sit with the ink
 * and paper. Used only on Listen — the rest of the site stays on the two
 * brand accents.
 */
export const LISTEN_COLOURS = [
  { bg: "#d63a2a", ink: "#fff7ec" }, // brand red
  { bg: "#3fb8a8", ink: "#0f1a18" }, // brand teal
  { bg: "#e0a92a", ink: "#231a05" }, // amber
  { bg: "#2f5fd6", ink: "#f2f5ff" }, // cobalt
  { bg: "#c2407e", ink: "#fff0f6" }, // magenta
  { bg: "#7d8b2e", ink: "#f7fbe8" }, // olive
] as const;

export type ListenColour = (typeof LISTEN_COLOURS)[number];

/**
 * Deterministic so a tile keeps its colour forever — the same release is
 * the same colour on every load, for every visitor, with nothing to pick
 * in admin. A plain sum of code points is enough: the ids are uuids, so
 * the low bits are already well mixed.
 */
export function colourFor(id: string): ListenColour {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum = (sum + id.charCodeAt(i) * (i + 1)) % 100003;
  return LISTEN_COLOURS[sum % LISTEN_COLOURS.length];
}

/**
 * YouTube titles arrive carrying their own packaging — "NIKI - Blue
 * (Official Music Video) [4K]". The tile prints the artist and track
 * itself, so the packaging is noise that would wrap the line onto three.
 */
const NOISE =
  /\s*[([]\s*(official\s*)?(music\s*)?(lyric\s*)?(video|visualizer|visualiser|audio|mv|m\/v|hd|4k|full\s*album|performance)\s*[^)\]]*[)\]]\s*/gi;

export function cleanTitle(raw: string): string {
  return raw.replace(NOISE, " ").replace(/\s{2,}/g, " ").replace(/\s*[-–—|]\s*$/, "").trim() || raw.trim();
}

/**
 * A YouTube title is usually "Artist - Track". Splitting on the first dash
 * lets the tile lead with the artist the way the reference does; when
 * there is no dash the whole title is the track and the channel stands in
 * for the artist.
 */
export function splitArtistTrack(title: string, channel: string | null): { artist: string; track: string } {
  const cleaned = cleanTitle(title);
  const match = cleaned.match(/^(.{2,60}?)\s+[-–—]\s+(.+)$/);
  if (match) return { artist: match[1].trim(), track: match[2].trim() };
  return { artist: (channel ?? "").trim(), track: cleaned };
}
