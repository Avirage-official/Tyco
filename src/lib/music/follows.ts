import type { createClient } from "@/lib/supabase/server";

export async function getFollowedArtistIds(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase.from("artist_follows").select("artist_id").eq("user_id", user.id);
  return (data ?? []).map((follow) => follow.artist_id);
}
