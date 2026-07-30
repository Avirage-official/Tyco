"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import detailStyles from "../../detail.module.css";

export function PlaylistActions({ playlistId, initialName }: { playlistId: string; initialName: string }) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(initialName);
  const [pending, setPending] = useState(false);

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || pending) return;
    setPending(true);

    const supabase = createClient();
    await supabase.from("playlists").update({ name: trimmed }).eq("id", playlistId);

    setPending(false);
    setRenaming(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!window.confirm("Delete this playlist? This can't be undone.")) return;
    setPending(true);

    const supabase = createClient();
    await supabase.from("playlists").delete().eq("id", playlistId);

    router.push("/music/library");
    router.refresh();
  }

  if (renaming) {
    return (
      <form className={detailStyles.newPlaylistForm} onSubmit={handleRename}>
        <input
          type="text"
          autoFocus
          className={detailStyles.newPlaylistInput}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={pending}
        />
        <div className={detailStyles.heroActions} style={{ marginTop: 0 }}>
          <Button type="submit" variant="ink">
            Save
          </Button>
          <Button type="button" variant="ghost" onClick={() => setRenaming(false)}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setRenaming(true)}>
        Rename
      </Button>
      <Button variant="ghost" onClick={handleDelete}>
        Delete
      </Button>
    </>
  );
}
