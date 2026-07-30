"use client";

import { useState } from "react";
import { IconClose, IconPause, IconPlay } from "@/components/icons";
import { NewBadge } from "@/components/ui/NewBadge";
import { LikeButton } from "@/components/music/LikeButton";
import { AddToPlaylistButton } from "@/components/music/AddToPlaylistButton";
import { createClient } from "@/lib/supabase/client";
import { usePlayer, type PlayableTrack } from "@/lib/player/PlayerContext";
import { formatDuration, isNew } from "@/lib/format";
import styles from "./page.module.css";

type Track = PlayableTrack & { duration_seconds: number | null; published_at: string | null };

export function TrackList({
  tracks,
  likedTrackIds = [],
  playlistId,
}: {
  tracks: Track[];
  likedTrackIds?: string[];
  playlistId?: string;
}) {
  const { current, isPlaying, playQueue, toggle } = usePlayer();
  const [list, setList] = useState(tracks);
  const likedSet = new Set(likedTrackIds);

  function handlePlayClick(track: Track, index: number) {
    if (current?.id === track.id) {
      toggle();
    } else {
      playQueue(list, index);
    }
  }

  async function handleRemove(trackId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!playlistId) return;
    setList((prev) => prev.filter((t) => t.id !== trackId));
    const supabase = createClient();
    await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", trackId);
  }

  return (
    <ol className={styles.list}>
      {list.map((track, i) => {
        const isCurrent = current?.id === track.id;
        return (
          <li key={track.id} className={styles.row}>
            <span className={styles.index}>{i + 1}</span>
            <button
              type="button"
              className={styles.playBtn}
              onClick={() => handlePlayClick(track, i)}
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
            <LikeButton trackId={track.id} initiallyLiked={likedSet.has(track.id)} size="sm" />
            {playlistId ? (
              <button
                type="button"
                className={styles.removeBtn}
                onClick={(e) => handleRemove(track.id, e)}
                aria-label={`Remove ${track.title} from playlist`}
              >
                <IconClose />
              </button>
            ) : (
              <AddToPlaylistButton trackId={track.id} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
