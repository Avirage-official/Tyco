"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IconHeart } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import styles from "./LikeButton.module.css";

export function LikeButton({
  trackId,
  initiallyLiked,
  size = "sm",
}: {
  trackId: string;
  initiallyLiked: boolean;
  size?: "sm" | "lg";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initiallyLiked);
  const [pending, setPending] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (pending) return;
    setPending(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      setPending(false);
      return;
    }

    if (liked) {
      setLiked(false);
      await supabase.from("track_likes").delete().eq("user_id", user.id).eq("track_id", trackId);
    } else {
      setLiked(true);
      await supabase.from("track_likes").insert({ user_id: user.id, track_id: trackId });
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      className={`${styles.btn} ${styles[size]} ${liked ? styles.liked : ""}`}
      onClick={handleClick}
      aria-label={liked ? "Unlike track" : "Like track"}
      aria-pressed={liked}
    >
      <IconHeart />
    </button>
  );
}
