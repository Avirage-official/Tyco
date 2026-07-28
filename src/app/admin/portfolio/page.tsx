import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { PublishBadge } from "../PublishBadge";
import { togglePortfolioPublish, deletePortfolioItem } from "./actions";
import styles from "../admin.module.css";

export default async function AdminPortfolioPage() {
  const { supabase } = await requireAdmin();
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, title, category, cover_url, is_published")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Portfolio</h2>
        <Link href="/admin/portfolio/new" className={styles.linkBtn}>
          + New item
        </Link>
      </div>

      {!items || items.length === 0 ? (
        <p className={styles.empty}>No portfolio items yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div
                      className={styles.rowThumb}
                      style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : undefined}
                    />
                  </td>
                  <td className={styles.rowTitle}>{item.title}</td>
                  <td className={styles.rowMeta}>{item.category ?? "—"}</td>
                  <td>
                    <PublishBadge isPublished={item.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/portfolio/${item.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={togglePortfolioPublish.bind(null, item.id, !item.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {item.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deletePortfolioItem.bind(null, item.id)}>
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
