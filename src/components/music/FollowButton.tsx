"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export function FollowButton({
  artistId,
  initiallyFollowing,
}: {
  artistId: string;
  initiallyFollowing: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [following, setFollowing] = useState(initiallyFollowing);
  const [pending, setPending] = useState(false);

  async function handleClick() {
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

    if (following) {
      setFollowing(false);
      await supabase.from("artist_follows").delete().eq("user_id", user.id).eq("artist_id", artistId);
    } else {
      setFollowing(true);
      await supabase.from("artist_follows").insert({ user_id: user.id, artist_id: artistId });
    }
    setPending(false);
  }

  return (
    <Button variant={following ? "ghost" : "ink"} onClick={handleClick} aria-pressed={following}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
