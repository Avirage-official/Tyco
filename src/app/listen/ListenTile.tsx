"use client";

import Image from "next/image";
import { useState } from "react";
import { IconArrowRight } from "@/components/icons";
import { colourFor, splitArtistTrack } from "@/lib/feed/releases";
import { extractYouTubeId } from "@/lib/feed/youtube-embed";
import type { Release } from "./types";
import styles from "./listen.module.css";

function shortDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return `${month} ${d.getUTCDate()}`.toUpperCase();
}

/**
 * One square. The artwork is there so a visitor can see who they are
 * looking at — a flat colour alone told them nothing — but it arrives
 * desaturated under the tile's own colour, multiplied over it. That keeps
 * a wall of mismatched YouTube thumbnails reading as one set instead of a
 * search results page, and it knocks back any title the artist baked into
 * their own artwork so it does not fight the title we print.
 *
 * Pointing at a tile lifts the colour off and the real photograph comes
 * back, which is also the moment someone is deciding whether to play it.
 */
export function ListenTile({ release, sizes }: { release: Release; sizes: string }) {
  const [playing, setPlaying] = useState(false);

  const { artist, track } = splitArtistTrack(release.title, release.channel);
  const colour = colourFor(release.id);
  const videoId = extractYouTubeId(release.href);
  // The channel is usually the artist's own, so printing both puts the
  // same name on the tile twice.
  const channel =
    release.channel && release.channel.trim().toLowerCase() !== artist.trim().toLowerCase()
      ? release.channel
      : null;

  if (playing && videoId) {
    return (
      <article className={styles.tile} style={{ "--tile-bg": colour.bg } as React.CSSProperties}>
        <iframe
          className={styles.embed}
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={`${artist} — ${track}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </article>
    );
  }

  const label = artist ? `${artist} – ${track}` : track;

  return (
    <article
      className={styles.tile}
      style={{ "--tile-bg": colour.bg, "--tile-ink": colour.ink } as React.CSSProperties}
    >
      {release.coverUrl && (
        <div className={styles.art} aria-hidden>
          <Image src={release.coverUrl} alt="" fill sizes={sizes} className={styles.artImage} />
          <span className={styles.artTint} />
        </div>
      )}
      <span className={styles.shade} aria-hidden />

      {videoId ? (
        <button
          type="button"
          className={styles.face}
          onClick={() => setPlaying(true)}
          aria-label={`Play ${label}`}
        >
          <span className={styles.play}>Play</span>
        </button>
      ) : (
        <a className={styles.face} href={release.href ?? undefined} target="_blank" rel="noreferrer">
          <span className={styles.play}>
            Listen <IconArrowRight aria-hidden />
          </span>
        </a>
      )}

      <span className={styles.date}>{shortDate(release.date)}</span>
      <span className={styles.credit}>
        <span className={styles.artist}>{label}</span>
        {channel && <span className={styles.channel}>{channel}</span>}
      </span>
    </article>
  );
}
