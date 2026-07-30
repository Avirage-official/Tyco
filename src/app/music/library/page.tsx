import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { IconHeart, IconPlaylist } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { MusicTabs } from "../MusicTabs";
import { NewPlaylistTile } from "./NewPlaylistTile";
import detailStyles from "../detail.module.css";

export const metadata: Metadata = { title: "Library" };

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/music/library");
  }

  const [{ count: likedCount }, { data: playlists }, { data: followIds }] = await Promise.all([
    supabase.from("track_likes").select("track_id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase
      .from("playlists")
      .select("id, name, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false }),
    supabase.from("artist_follows").select("artist_id").eq("user_id", user.id),
  ]);

  const playlistIds = (playlists ?? []).map((p) => p.id);
  const followedArtistIds = (followIds ?? []).map((f) => f.artist_id);

  const [{ data: playlistTracks }, { data: followedArtists }] = await Promise.all([
    playlistIds.length > 0
      ? supabase.from("playlist_tracks").select("playlist_id").in("playlist_id", playlistIds)
      : Promise.resolve({ data: [] as { playlist_id: string }[] }),
    followedArtistIds.length > 0
      ? supabase
          .from("artists")
          .select("id, name, photo_url")
          .in("id", followedArtistIds)
          .eq("is_published", true)
          .order("name")
      : Promise.resolve({ data: [] as { id: string; name: string; photo_url: string | null }[] }),
  ]);

  const trackCountByPlaylist = new Map<string, number>();
  for (const row of playlistTracks ?? []) {
    trackCountByPlaylist.set(row.playlist_id, (trackCountByPlaylist.get(row.playlist_id) ?? 0) + 1);
  }

  return (
    <>
      <PageHeader eyebrow="Yours" title="Library" description="Everything you've saved and followed." />
      <div className="container">
        <MusicTabs />

        <Link href="/music/liked" className={detailStyles.libraryCard}>
          <span className={detailStyles.libraryCardIcon}>
            <IconHeart />
          </span>
          <span>
            <span className={detailStyles.libraryCardTitle}>Liked Songs</span>
            <br />
            <span className={detailStyles.libraryCardMeta}>{likedCount ?? 0} tracks</span>
          </span>
        </Link>

        <h2 className={detailStyles.sectionTitle} style={{ marginTop: 0 }}>
          Playlists
        </h2>
        <div className={detailStyles.playlistGrid}>
          <NewPlaylistTile userId={user.id} />
          {(playlists ?? []).map((playlist) => (
            <Link key={playlist.id} href={`/music/playlists/${playlist.id}`} className={detailStyles.playlistCard}>
              <span className={detailStyles.playlistCover}>
                <IconPlaylist />
              </span>
              <span className={detailStyles.playlistCardTitle}>{playlist.name}</span>
              <span className={detailStyles.playlistCardMeta}>
                {trackCountByPlaylist.get(playlist.id) ?? 0} tracks
              </span>
            </Link>
          ))}
        </div>

        {followedArtists && followedArtists.length > 0 && (
          <>
            <h2 className={detailStyles.sectionTitle}>Following</h2>
            <div className={detailStyles.artistsRow}>
              {followedArtists.map((artist) => (
                <Link key={artist.id} href={`/music/artists/${artist.id}`} className={detailStyles.artistCard}>
                  <div
                    className={detailStyles.artistPhoto}
                    style={artist.photo_url ? { backgroundImage: `url(${artist.photo_url})` } : undefined}
                  />
                  <span className={detailStyles.artistName}>{artist.name}</span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
