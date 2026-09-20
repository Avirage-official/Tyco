"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { colourFor, splitArtistTrack } from "@/lib/feed/releases";
import { extractYouTubeId } from "@/lib/feed/youtube-embed";
import type { Release } from "./ListenRail";
import styles from "./listen.module.css";

function shortDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  const month = d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return `${month} ${d.getUTCDate()}`.toUpperCase();
}

/**
 * Everything the rail does not carry. The same tile, in a grid, so a
 * release from three months ago is findable without dragging the rail
 * across sixty items.
 */
export function ListenArchive({ releases }: { releases: Release[] }) {
  const [playing, setPlaying] = useState<string | null>(null);

  return (
    <section className={styles.archive}>
      <div className={`container ${styles.archiveInner}`}>
        <h2 className={styles.archiveTitle}>Earlier</h2>

        <motion.div
          className={styles.grid}
          variants={fadeUpContainer}
          initial="hidden"
          whileInView="visible"
          viewport={revealViewport}
        >
          {releases.map((release) => {
            const { artist, track } = splitArtistTrack(release.title, release.channel);
            // The channel is usually the artist's own, so printing both puts
            // the same name on the tile twice.
            const channel =
              release.channel && release.channel.trim().toLowerCase() !== artist.trim().toLowerCase()
                ? release.channel
                : null;
            const colour = colourFor(release.id);
            const videoId = extractYouTubeId(release.href);
            const isPlaying = playing === release.id;

            return (
              <motion.article
                key={release.id}
                className={styles.tile}
                variants={fadeUpItem}
                style={{ "--tile-bg": colour.bg, "--tile-ink": colour.ink } as React.CSSProperties}
              >
                {isPlaying && videoId ? (
                  <iframe
                    className={styles.embed}
                    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
                    title={`${artist} — ${track}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <>
                    {videoId ? (
                      <button
                        type="button"
                        className={styles.face}
                        onClick={() => setPlaying(release.id)}
                        aria-label={`Play ${artist} — ${track}`}
                      >
                        <span className={styles.play}>Play</span>
                      </button>
                    ) : (
                      <a
                        className={styles.face}
                        href={release.href ?? undefined}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <span className={styles.play}>Listen</span>
                      </a>
                    )}

                    <span className={styles.date}>{shortDate(release.date)}</span>
                    <span className={styles.credit}>
                      <span className={styles.artist}>
                        {artist ? `${artist} – ${track}` : track}
                      </span>
                      {channel && <span className={styles.channel}>{channel}</span>}
                    </span>
                  </>
                )}
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
