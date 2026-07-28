"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  IconChevronDown,
  IconClose,
  IconPause,
  IconPlay,
  IconRepeat,
  IconShuffle,
  IconSkipNext,
  IconSkipPrevious,
} from "@/components/icons";
import { LikeButton } from "@/components/music/LikeButton";
import { usePlayer } from "@/lib/player/PlayerContext";
import { createClient } from "@/lib/supabase/client";
import { formatDuration } from "@/lib/format";
import styles from "./NowPlayingFull.module.css";

export function NowPlayingFull() {
  const player = usePlayer();
  const { current, isPlaying, currentTime, duration, shuffle, repeat, queue, playOrder, position } = player;
  const [initiallyLiked, setInitiallyLiked] = useState(false);

  useEffect(() => {
    if (!current) return;
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setInitiallyLiked(false);
        return;
      }
      const { data } = await supabase
        .from("track_likes")
        .select("track_id")
        .eq("user_id", user.id)
        .eq("track_id", current.id)
        .maybeSingle();
      if (!cancelled) setInitiallyLiked(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
  }, [current]);

  if (!player.isExpanded || !current) return null;

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const upNext = playOrder.slice(position + 1).map((queueIndex, i) => ({
    playOrderIndex: position + 1 + i,
    track: queue[queueIndex],
  }));

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Now playing">
      <div className={styles.topBar}>
        <button
          type="button"
          className={styles.collapseBtn}
          onClick={player.collapse}
          aria-label="Minimize player"
        >
          <IconChevronDown />
        </button>
        <span className={styles.topLabel}>Now Playing</span>
        <span style={{ width: "2.4rem" }} aria-hidden />
      </div>

      <div className={styles.body}>
        <div
          className={styles.cover}
          style={current.cover_url ? { backgroundImage: `url(${current.cover_url})` } : undefined}
        />

        <div className={styles.meta}>
          <div style={{ minWidth: 0 }}>
            <p className={styles.title}>{current.title}</p>
            <p className={styles.artist}>
              {current.artist_id ? (
                <Link href={`/music/artists/${current.artist_id}`} onClick={player.collapse}>
                  {current.artist}
                </Link>
              ) : (
                current.artist
              )}
              {current.album_id && (
                <>
                  {" · "}
                  <Link href={`/music/albums/${current.album_id}`} onClick={player.collapse}>
                    View album
                  </Link>
                </>
              )}
            </p>
          </div>
          <LikeButton key={current.id} trackId={current.id} initiallyLiked={initiallyLiked} size="lg" />
        </div>

        <div className={styles.scrubber}>
          <input
            type="range"
            className={styles.range}
            min={0}
            max={duration || 0}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => player.seek(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`,
            }}
            aria-label="Seek"
          />
          <div className={styles.times}>
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        <div className={styles.transport}>
          <button
            type="button"
            className={`${styles.transportBtn} ${shuffle ? styles.active : ""}`}
            onClick={player.toggleShuffle}
            aria-label="Shuffle"
            aria-pressed={shuffle}
          >
            <IconShuffle />
          </button>
          <button
            type="button"
            className={`${styles.transportBtn} ${styles.skipBtn}`}
            onClick={player.previous}
            aria-label="Previous track"
          >
            <IconSkipPrevious />
          </button>
          <button
            type="button"
            className={styles.playBtn}
            onClick={player.toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <IconPause /> : <IconPlay />}
          </button>
          <button
            type="button"
            className={`${styles.transportBtn} ${styles.skipBtn}`}
            onClick={player.next}
            aria-label="Next track"
          >
            <IconSkipNext />
          </button>
          <button
            type="button"
            className={`${styles.transportBtn} ${styles.repeatWrap} ${repeat !== "off" ? styles.active : ""}`}
            onClick={player.cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
          >
            <IconRepeat />
            {repeat === "one" && <span className={styles.repeatOneBadge}>1</span>}
          </button>
        </div>

        <div className={styles.queue}>
          <p className={styles.queueHeader}>Up next</p>
          {upNext.length === 0 ? (
            <p className={styles.queueEmpty}>Nothing queued after this.</p>
          ) : (
            upNext.map(({ playOrderIndex, track }) => (
              <div key={`${track.id}-${playOrderIndex}`} className={styles.queueRow}>
                <button
                  type="button"
                  className={styles.queueRowMain}
                  onClick={() => player.playFromQueue(playOrderIndex)}
                >
                  <span className={styles.queueTitle}>{track.title}</span>
                  <span className={styles.queueArtist}>{track.artist}</span>
                </button>
                <button
                  type="button"
                  className={styles.queueRemove}
                  onClick={() => player.removeFromQueue(playOrderIndex)}
                  aria-label={`Remove ${track.title} from queue`}
                >
                  <IconClose />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
