import type { createClient } from "@/lib/supabase/server";

export async function getLikedTrackIds(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase.from("track_likes").select("track_id").eq("user_id", user.id);
  return (data ?? []).map((like) => like.track_id);
}
