import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatDate } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleAlbumPublish, deleteAlbum } from "./actions";
import styles from "../admin.module.css";

export default async function AdminAlbumsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: albums }, { data: artists }] = await Promise.all([
    supabase
      .from("albums")
      .select("id, title, artist_id, cover_url, release_date, is_published")
      .order("created_at", { ascending: false }),
    supabase.from("artists").select("id, name"),
  ]);

  const artistNameById = new Map((artists ?? []).map((a) => [a.id, a.name]));

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Albums</h2>
        <Link href="/admin/albums/new" className={styles.linkBtn}>
          + New album
        </Link>
      </div>

      {!albums || albums.length === 0 ? (
        <p className={styles.empty}>No albums yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Artist</th>
                <th>Release date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.id}>
                  <td>
                    <div
                      className={styles.rowThumb}
                      style={album.cover_url ? { backgroundImage: `url(${album.cover_url})` } : undefined}
                    />
                  </td>
                  <td className={styles.rowTitle}>{album.title}</td>
                  <td className={styles.rowMeta}>
                    {album.artist_id ? artistNameById.get(album.artist_id) ?? "—" : "—"}
                  </td>
                  <td className={styles.rowMeta}>{formatDate(album.release_date)}</td>
                  <td>
                    <PublishBadge isPublished={album.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/albums/${album.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <Link href={`/admin/albums/${album.id}/tracks`} className={styles.linkBtn}>
                        Add tracks
                      </Link>
                      <form action={toggleAlbumPublish.bind(null, album.id, !album.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {album.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteAlbum.bind(null, album.id)}>
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
