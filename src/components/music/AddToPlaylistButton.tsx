"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { IconCheck, IconPlus } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import styles from "./AddToPlaylistButton.module.css";

type Playlist = { id: string; name: string };

export function AddToPlaylistButton({ trackId }: { trackId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [memberOf, setMemberOf] = useState<Set<string>>(new Set());
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  async function openMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    setOpen(true);
    setLoading(true);
    const [{ data: lists }, { data: memberships }] = await Promise.all([
      supabase.from("playlists").select("id, name").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("playlist_tracks").select("playlist_id").eq("track_id", trackId),
    ]);
    setPlaylists(lists ?? []);
    setMemberOf(new Set((memberships ?? []).map((m) => m.playlist_id)));
    setLoading(false);
  }

  async function toggle(playlistId: string, e: React.MouseEvent) {
    e.stopPropagation();
    const supabase = createClient();
    const inPlaylist = memberOf.has(playlistId);

    if (inPlaylist) {
      setMemberOf((prev) => {
        const next = new Set(prev);
        next.delete(playlistId);
        return next;
      });
      await supabase.from("playlist_tracks").delete().eq("playlist_id", playlistId).eq("track_id", trackId);
    } else {
      setMemberOf((prev) => new Set(prev).add(playlistId));
      const { count } = await supabase
        .from("playlist_tracks")
        .select("track_id", { count: "exact", head: true })
        .eq("playlist_id", playlistId);
      await supabase.from("playlist_tracks").insert({ playlist_id: playlistId, track_id: trackId, position: count ?? 0 });
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    const trimmed = newName.trim();
    if (!trimmed) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: playlist, error } = await supabase
      .from("playlists")
      .insert({ user_id: user.id, name: trimmed })
      .select("id, name")
      .single();
    if (error || !playlist) return;

    await supabase.from("playlist_tracks").insert({ playlist_id: playlist.id, track_id: trackId, position: 0 });

    setPlaylists((prev) => [playlist, ...prev]);
    setMemberOf((prev) => new Set(prev).add(playlist.id));
    setNewName("");
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={(e) => {
          e.stopPropagation();
          if (open) {
            setOpen(false);
          } else {
            openMenu(e);
          }
        }}
        aria-label="Add to playlist"
      >
        <IconPlus />
      </button>

      {open && (
        <div className={styles.menu} onClick={(e) => e.stopPropagation()}>
          <div className={styles.menuLabel}>Add to playlist</div>
          {loading ? (
            <div className={styles.empty}>Loading…</div>
          ) : playlists.length === 0 ? (
            <div className={styles.empty}>No playlists yet</div>
          ) : (
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                className={styles.item}
                onClick={(e) => toggle(playlist.id, e)}
              >
                <span className={styles.itemName}>{playlist.name}</span>
                {memberOf.has(playlist.id) && (
                  <span className={styles.itemCheck}>
                    <IconCheck />
                  </span>
                )}
              </button>
            ))
          )}
          <form className={styles.newForm} onSubmit={handleCreate}>
            <input
              type="text"
              className={styles.newInput}
              placeholder="New playlist"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
            <button type="submit" className={styles.newSubmit} aria-label="Create playlist">
              <IconPlus />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
