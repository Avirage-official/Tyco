"use client";

import { IconPlay } from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { usePlayer, type PlayableTrack } from "@/lib/player/PlayerContext";

export function PlayTracksButton({
  tracks,
  label = "Play",
  shuffle = false,
  variant,
}: {
  tracks: PlayableTrack[];
  label?: string;
  shuffle?: boolean;
  variant?: "primary" | "ghost" | "ink";
}) {
  const { playQueue } = usePlayer();

  if (tracks.length === 0) return null;

  function handleClick() {
    const startIndex = shuffle ? Math.floor(Math.random() * tracks.length) : 0;
    playQueue(tracks, startIndex, { shuffle });
  }

  return (
    <Button onClick={handleClick} variant={variant}>
      <IconPlay style={{ width: 15, height: 15 }} />
      {label}
    </Button>
  );
}
