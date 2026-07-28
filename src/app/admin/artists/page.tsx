import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { PublishBadge } from "../PublishBadge";
import { toggleArtistPublish, deleteArtist } from "./actions";
import styles from "../admin.module.css";

export default async function AdminArtistsPage() {
  const { supabase } = await requireAdmin();
  const { data: artists } = await supabase
    .from("artists")
    .select("id, name, photo_url, is_published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Artists</h2>
        <Link href="/admin/artists/new" className={styles.linkBtn}>
          + New artist
        </Link>
      </div>

      {!artists || artists.length === 0 ? (
        <p className={styles.empty}>No artists yet — add your first one (e.g. &quot;Tyco&quot;).</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id}>
                  <td>
                    <div
                      className={styles.rowThumb}
                      style={artist.photo_url ? { backgroundImage: `url(${artist.photo_url})` } : undefined}
                    />
                  </td>
                  <td className={styles.rowTitle}>{artist.name}</td>
                  <td>
                    <PublishBadge isPublished={artist.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/artists/${artist.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleArtistPublish.bind(null, artist.id, !artist.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {artist.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteArtist.bind(null, artist.id)}>
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
