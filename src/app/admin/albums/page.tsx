import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatDate } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleAlbumPublish, deleteAlbum } from "./actions";
import styles from "../admin.module.css";

export default async function AdminAlbumsPage() {
  const { supabase } = await requireAdmin();
  const { data: albums } = await supabase
    .from("albums")
    .select("id, title, cover_url, release_date, is_published")
    .order("created_at", { ascending: false });

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
                  <td className={styles.rowMeta}>{formatDate(album.release_date)}</td>
                  <td>
                    <PublishBadge isPublished={album.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/albums/${album.id}`} className={styles.linkBtn}>
                        Edit
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
