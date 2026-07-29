import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { PublishBadge } from "../PublishBadge";
import { toggleTrackPublish, deleteTrack } from "./actions";
import styles from "../admin.module.css";

export default async function AdminTracksPage() {
  const { supabase } = await requireAdmin();
  const [{ data: tracks }, { data: albums }, { data: artists }] = await Promise.all([
    supabase
      .from("tracks")
      .select("id, title, artist_id, cover_url, album_id, genre, is_published")
      .order("created_at", { ascending: false }),
    supabase.from("albums").select("id, title"),
    supabase.from("artists").select("id, name"),
  ]);

  const albumTitleById = new Map((albums ?? []).map((a) => [a.id, a.title]));
  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Tracks</h2>
        <Link href="/admin/tracks/new" className={styles.linkBtn}>
          + New track
        </Link>
      </div>

      {!tracks || tracks.length === 0 ? (
        <p className={styles.empty}>No tracks yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Album</th>
                <th>Genre</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td>
                    <div
                      className={styles.rowThumb}
                      style={track.cover_url ? { backgroundImage: `url(${track.cover_url})` } : undefined}
                    />
                  </td>
                  <td>
                    <div className={styles.rowTitle}>{track.title}</div>
                    <div className={styles.rowMeta}>
                      {track.artist_id ? artistNameById.get(track.artist_id) ?? "—" : "—"}
                    </div>
                  </td>
                  <td className={styles.rowMeta}>
                    {track.album_id ? albumTitleById.get(track.album_id) ?? "—" : "Single"}
                  </td>
                  <td className={styles.rowMeta}>{track.genre ?? "—"}</td>
                  <td>
                    <PublishBadge isPublished={track.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/tracks/${track.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleTrackPublish.bind(null, track.id, !track.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {track.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteTrack.bind(null, track.id)}>
                        <button type="submit" className={styles.dangerBtn}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
