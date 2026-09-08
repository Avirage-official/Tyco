// Deliberately not "server-only" — this pure URL-parsing helper is shared
// between the Journal server page and the client-side JournalList (which
// needs it to build an embed src when a card is clicked).

/**
 * Pulls the video ID out of a youtube.com/watch, youtu.be, or /embed URL —
 * used by the Journal page to decide whether a feed item can render an
 * inline embed or just a plain "open link" card.
 */
export function extractYouTubeId(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1) || null;
    if (parsed.hostname.endsWith("youtube.com")) {
      if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
      if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}
