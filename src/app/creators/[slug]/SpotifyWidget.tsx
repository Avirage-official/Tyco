"use client";

import { useState } from "react";
import { toSpotifyEmbedUrl } from "@/lib/embeds";
import styles from "./CreatorPage.module.css";

/**
 * Floating corner player — mounted only inside CreatorPage, so it lives and
 * dies with this route rather than persisting across the rest of the site.
 */
export function SpotifyWidget({ url, name }: { url: string; name: string }) {
  const [dismissed, setDismissed] = useState(false);
  const embedUrl = toSpotifyEmbedUrl(url);

  if (!embedUrl || dismissed) return null;

  return (
    <div className={styles.spotifyWidget}>
      <span className={styles.spotifyPulse} aria-hidden />
      <iframe
        title={`${name} on Spotify`}
        src={embedUrl}
        width="100%"
        height="80"
        style={{ border: 0, display: "block" }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />
      <button
        type="button"
        className={styles.spotifyClose}
        onClick={() => setDismissed(true)}
        aria-label="Close Spotify player"
      >
        &times;
      </button>
    </div>
  );
}
