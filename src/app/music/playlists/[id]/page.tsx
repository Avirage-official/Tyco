import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconPlaylist } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { getLikedTrackIds } from "@/lib/music/liked";
import { TrackList } from "../../TrackList";
import { PlayTracksButton } from "../../PlayTracksButton";
import { PlaylistActions } from "./PlaylistActions";
import detailStyles from "../../detail.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: playlist } = await supabase.from("playlists").select("name").eq("id", id).single();
  return { title: playlist?.name ?? "Playlist" };
}

export default async function PlaylistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/music/playlists/${id}`)}`);
  }

  const { data: playlist } = await supabase.from("playlists").select("id, name").eq("id", id).single();
  if (!playlist) notFound();

  const [{ data: playlistTracks }, likedTrackIds] = await Promise.all([
    supabase.from("playlist_tracks").select("track_id, position").eq("playlist_id", id).order("position"),
    getLikedTrackIds(supabase),
  ]);

  const orderedIds = (playlistTracks ?? []).map((pt) => pt.track_id);

  const [{ data: tracks }, { data: artists }] = await Promise.all([
    orderedIds.length > 0
      ? supabase
          .from("tracks")
          .select("id, title, artist_id, cover_url, audio_url, duration_seconds, published_at")
          .in("id", orderedIds)
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("artists").select("id, name"),
  ]);

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));
  const positionById = new Map(orderedIds.map((trackId, i) => [trackId, i]));
  const tracksWithArtist = (tracks ?? [])
    .map((track) => ({
      ...track,
      artist: (track.artist_id && artistNameById.get(track.artist_id)) || "Tyco",
    }))
    .sort((a, b) => (positionById.get(a.id) ?? 0) - (positionById.get(b.id) ?? 0));

  return (
    <div className="container">
      <div className={detailStyles.hero}>
        <div className={detailStyles.heroCover} style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-muted)" }}>
          <IconPlaylist style={{ width: 56, height: 56 }} />
        </div>
        <div className={detailStyles.heroMeta}>
          <p className="eyebrow">Playlist</p>
          <h1 className={detailStyles.heroTitle}>{playlist.name}</h1>
          <p className={detailStyles.heroSub}>{tracksWithArtist.length} tracks</p>
          <div className={detailStyles.heroActions}>
            {tracksWithArtist.length > 0 && <PlayTracksButton tracks={tracksWithArtist} />}
            <PlaylistActions playlistId={playlist.id} initialName={playlist.name} />
          </div>
        </div>
      </div>

      {tracksWithArtist.length > 0 ? (
        <TrackList tracks={tracksWithArtist} likedTrackIds={likedTrackIds} playlistId={playlist.id} />
      ) : (
        <EmptyState
          title="No tracks yet"
          description="Use the + button on any track to add it to this playlist."
        />
      )}
    </div>
  );
}
