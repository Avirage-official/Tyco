import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { TrackList } from "./TrackList";

export const metadata: Metadata = { title: "Music" };

export default async function MusicPage() {
  const supabase = await createClient();
  const { data: tracks } = await supabase
    .from("tracks")
    .select("id, title, artist, cover_url, audio_url, duration_seconds")
    .eq("is_published", true)
    .order("release_date", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="Free, always"
        title="Music"
        description="Every track we've put out, free to stream — no account, no paywall."
      />
      <div className="container">
        {tracks && tracks.length > 0 ? (
          <TrackList tracks={tracks} />
        ) : (
          <EmptyState
            title="The catalogue is warming up"
            description="Tracks published in Supabase will show up here automatically, ready to stream."
          />
        )}
      </div>
    </>
  );
}
