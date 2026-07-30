"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "../detail.module.css";

export function NewPlaylistTile({ userId }: { userId: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("playlists")
      .insert({ user_id: userId, name: trimmed })
      .select("id")
      .single();

    setPending(false);
    if (error || !data) return;
    router.push(`/music/playlists/${data.id}`);
    router.refresh();
  }

  if (!editing) {
    return (
      <button type="button" className={styles.playlistCard} onClick={() => setEditing(true)}>
        <span className={styles.newPlaylistCover}>+</span>
        <span className={styles.playlistCardTitle}>New Playlist</span>
      </button>
    );
  }

  return (
    <form
      className={`${styles.playlistCard} ${styles.newPlaylistForm}`}
      onSubmit={(e) => {
        e.preventDefault();
        handleCreate();
      }}
    >
      <span className={styles.newPlaylistCover}>+</span>
      <input
        type="text"
        autoFocus
        className={styles.newPlaylistInput}
        placeholder="Playlist name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (!name.trim()) setEditing(false);
        }}
        disabled={pending}
      />
    </form>
  );
}
