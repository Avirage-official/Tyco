"use client";

import { IconPause, IconPlay } from "@/components/icons";
import { usePlayer } from "@/lib/player/PlayerContext";
import styles from "./NowPlayingBar.module.css";

export function NowPlayingBar() {
  const { current, isPlaying, toggle } = usePlayer();

  if (!current) return null;

  return (
    <div className={styles.bar}>
      <div
        className={styles.cover}
        style={current.cover_url ? { backgroundImage: `url(${current.cover_url})` } : undefined}
        aria-hidden
      />
      <div className={styles.meta}>
        <p className={styles.title}>{current.title}</p>
        <p className={styles.artist}>{current.artist}</p>
      </div>
      <button
        type="button"
        className={styles.toggle}
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <IconPause /> : <IconPlay />}
      </button>
    </div>
  );
}
