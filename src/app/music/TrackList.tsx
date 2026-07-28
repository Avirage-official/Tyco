"use client";

import { IconPause, IconPlay } from "@/components/icons";
import { NewBadge } from "@/components/ui/NewBadge";
import { usePlayer, type PlayableTrack } from "@/lib/player/PlayerContext";
import { isNew } from "@/lib/format";
import styles from "./page.module.css";

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export function TrackList({
  tracks,
}: {
  tracks: (PlayableTrack & { duration_seconds: number | null; published_at: string | null })[];
}) {
  const { current, isPlaying, play } = usePlayer();

  return (
    <ol className={styles.list}>
      {tracks.map((track, i) => {
        const isCurrent = current?.id === track.id;
        return (
          <li key={track.id} className={styles.row}>
            <span className={styles.index}>{i + 1}</span>
            <button
              type="button"
              className={styles.playBtn}
              onClick={() => play(track)}
              aria-label={isCurrent && isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
            >
              {isCurrent && isPlaying ? <IconPause /> : <IconPlay />}
            </button>
            <span
              className={styles.cover}
              style={track.cover_url ? { backgroundImage: `url(${track.cover_url})` } : undefined}
              aria-hidden
            />
            <span className={styles.meta}>
              <span className={styles.title}>
                {track.title} {isNew(track.published_at) && <NewBadge />}
              </span>
              <span className={styles.sub}>{track.artist}</span>
            </span>
            <span className={styles.duration}>{formatDuration(track.duration_seconds)}</span>
          </li>
        );
      })}
    </ol>
  );
}
