"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

export type PlayableTrack = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  audio_url: string;
  album_id?: string | null;
  artist_id?: string | null;
};

export type RepeatMode = "off" | "all" | "one";

type PlayerState = {
  queue: PlayableTrack[];
  playOrder: number[];
  current: PlayableTrack | null;
  position: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  isExpanded: boolean;
  playQueue: (tracks: PlayableTrack[], startIndex: number, options?: { shuffle?: boolean }) => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  removeFromQueue: (playOrderIndex: number) => void;
  playFromQueue: (playOrderIndex: number) => void;
  expand: () => void;
  collapse: () => void;
};

const PlayerCtx = createContext<PlayerState | null>(null);

function sequentialOrder(length: number) {
  return Array.from({ length }, (_, i) => i);
}

/** Fisher-Yates shuffle of every index except `keepFirst`, which is placed at position 0. */
function shuffledOrder(length: number, keepFirst: number) {
  const rest = sequentialOrder(length).filter((i) => i !== keepFirst);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return keepFirst >= 0 ? [keepFirst, ...rest] : rest;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<PlayableTrack[]>([]);
  const [playOrder, setPlayOrder] = useState<number[]>([]);
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [isExpanded, setIsExpanded] = useState(false);

  const currentIndex = playOrder[position] ?? -1;
  const current = currentIndex >= 0 ? queue[currentIndex] ?? null : null;

  const loadAndPlay = useCallback((track: PlayableTrack) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = track.audio_url;
    audio.currentTime = 0;
    audio.play();
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);

    createClient()
      .rpc("increment_play_count", { track_id: track.id })
      .then(undefined, () => {});
  }, []);

  const goToPosition = useCallback(
    (newPosition: number) => {
      if (newPosition < 0 || newPosition >= playOrder.length) return;
      setPosition(newPosition);
      const track = queue[playOrder[newPosition]];
      if (track) loadAndPlay(track);
    },
    [playOrder, queue, loadAndPlay]
  );

  const playQueue = useCallback(
    (tracks: PlayableTrack[], startIndex: number, options?: { shuffle?: boolean }) => {
      setQueue(tracks);
      if (options?.shuffle) {
        setPlayOrder(shuffledOrder(tracks.length, startIndex));
        setShuffle(true);
        setPosition(0);
      } else {
        setPlayOrder(sequentialOrder(tracks.length));
        setShuffle(false);
        setPosition(startIndex);
      }
      const track = tracks[startIndex];
      if (track) loadAndPlay(track);
    },
    [loadAndPlay]
  );

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;
    if (audio.paused) {
      audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [current]);

  /** Manual "skip forward" — always advances, ignoring repeat-one. */
  const next = useCallback(() => {
    let nextPos = position + 1;
    if (nextPos >= playOrder.length) {
      if (repeat === "all") nextPos = 0;
      else return;
    }
    goToPosition(nextPos);
  }, [position, playOrder.length, repeat, goToPosition]);

  /** Natural end-of-track — repeat-one restarts the same track instead of advancing. */
  const handleEnded = useCallback(() => {
    if (repeat === "one") {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
      return;
    }
    let nextPos = position + 1;
    if (nextPos >= playOrder.length) {
      if (repeat === "all") nextPos = 0;
      else {
        setIsPlaying(false);
        return;
      }
    }
    goToPosition(nextPos);
  }, [position, playOrder.length, repeat, goToPosition]);

  const previous = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    let prevPos = position - 1;
    if (prevPos < 0) {
      if (repeat === "all") prevPos = playOrder.length - 1;
      else prevPos = 0;
    }
    goToPosition(prevPos);
  }, [position, playOrder.length, repeat, goToPosition]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const isOn = !prev;
      if (isOn) {
        setPlayOrder(shuffledOrder(queue.length, currentIndex));
        setPosition(0);
      } else {
        setPlayOrder(sequentialOrder(queue.length));
        setPosition(currentIndex >= 0 ? currentIndex : 0);
      }
      return isOn;
    });
  }, [queue.length, currentIndex]);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => (prev === "off" ? "all" : prev === "all" ? "one" : "off"));
  }, []);

  const removeFromQueue = useCallback(
    (playOrderIndex: number) => {
      if (playOrderIndex === position) return;
      setPlayOrder((prev) => prev.filter((_, i) => i !== playOrderIndex));
      setPosition((prev) => (playOrderIndex < prev ? prev - 1 : prev));
    },
    [position]
  );

  const playFromQueue = useCallback((playOrderIndex: number) => goToPosition(playOrderIndex), [
    goToPosition,
  ]);

  const expand = useCallback(() => setIsExpanded(true), []);
  const collapse = useCallback(() => setIsExpanded(false), []);

  // Media Session — lock-screen / notification playback controls.
  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator) || !current) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: current.cover_url ? [{ src: current.cover_url, sizes: "512x512", type: "image/jpeg" }] : [],
    });

    navigator.mediaSession.setActionHandler("play", toggle);
    navigator.mediaSession.setActionHandler("pause", toggle);
    navigator.mediaSession.setActionHandler("previoustrack", previous);
    navigator.mediaSession.setActionHandler("nexttrack", next);
    navigator.mediaSession.setActionHandler("seekto", (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
  }, [current, toggle, previous, next, seek]);

  useEffect(() => {
    if (typeof window === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  const value = useMemo<PlayerState>(
    () => ({
      queue,
      playOrder,
      current,
      position,
      isPlaying,
      currentTime,
      duration,
      shuffle,
      repeat,
      isExpanded,
      playQueue,
      toggle,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      removeFromQueue,
      playFromQueue,
      expand,
      collapse,
    }),
    [
      queue,
      playOrder,
      current,
      position,
      isPlaying,
      currentTime,
      duration,
      shuffle,
      repeat,
      isExpanded,
      playQueue,
      toggle,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      removeFromQueue,
      playFromQueue,
      expand,
      collapse,
    ]
  );

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
    </PlayerCtx.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("usePlayer must be used within a PlayerProvider");
  return ctx;
}
