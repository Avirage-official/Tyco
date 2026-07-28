"use client";

import { IconPause, IconPlay, IconSkipNext } from "@/components/icons";
import { usePlayer } from "@/lib/player/PlayerContext";
import styles from "./NowPlayingBar.module.css";

export function NowPlayingBar() {
  const { current, isPlaying, toggle, next, expand, currentTime, duration } = usePlayer();

  if (!current) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={styles.bar}>
      <div className={styles.progress}>
        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
      </div>
      <button type="button" className={styles.tapArea} onClick={expand} aria-label="Open now playing">
        <div
          className={styles.cover}
          style={current.cover_url ? { backgroundImage: `url(${current.cover_url})` } : undefined}
          aria-hidden
        />
        <div className={styles.meta}>
          <p className={styles.title}>{current.title}</p>
          <p className={styles.artist}>{current.artist}</p>
        </div>
      </button>
      <button
        type="button"
        className={`${styles.iconBtn} ${styles.iconBtnPrimary}`}
        onClick={(e) => {
          e.stopPropagation();
          toggle();
        }}
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <IconPause /> : <IconPlay />}
      </button>
      <button
        type="button"
        className={styles.iconBtn}
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        aria-label="Next track"
      >
        <IconSkipNext />
      </button>
    </div>
  );
}
