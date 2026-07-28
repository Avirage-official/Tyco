"use client";

import { createContext, useContext, useMemo, useRef, useState } from "react";

export type PlayableTrack = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  audio_url: string;
};

type PlayerState = {
  current: PlayableTrack | null;
  isPlaying: boolean;
  play: (track: PlayableTrack) => void;
  toggle: () => void;
};

const PlayerCtx = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<PlayableTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const value = useMemo<PlayerState>(
    () => ({
      current,
      isPlaying,
      play: (track) => {
        const audio = audioRef.current;
        if (!audio) return;
        if (current?.id !== track.id) {
          setCurrent(track);
          audio.src = track.audio_url;
          audio.play();
          setIsPlaying(true);
        } else {
          if (audio.paused) {
            audio.play();
            setIsPlaying(true);
          } else {
            audio.pause();
            setIsPlaying(false);
          }
        }
      },
      toggle: () => {
        const audio = audioRef.current;
        if (!audio || !current) return;
        if (audio.paused) {
          audio.play();
          setIsPlaying(true);
        } else {
          audio.pause();
          setIsPlaying(false);
        }
      },
    }),
    [current, isPlaying]
  );

  return (
    <PlayerCtx.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
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
