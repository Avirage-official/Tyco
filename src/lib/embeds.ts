/** Converts a youtube.com/youtu.be watch/playlist URL into an embeddable iframe src. */
export function toYouTubeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (u.pathname === "/playlist") {
        const list = u.searchParams.get("list");
        return list ? `https://www.youtube.com/embed/videoseries?list=${list}` : null;
      }
      if (u.pathname.startsWith("/embed/")) {
        return url;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/** Converts a track/album/artist/playlist open.spotify.com URL into an embeddable iframe src. */
export function toSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.replace(/^www\./, "").endsWith("spotify.com")) return null;

    const match = u.pathname.match(/\/(track|album|artist|playlist|episode|show)\/([a-zA-Z0-9]+)/);
    if (!match) return null;

    const [, type, id] = match;
    return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
  } catch {
    return null;
  }
}
