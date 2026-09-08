import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { formatDate } from "@/lib/format";
import { PublishBadge } from "../PublishBadge";
import { toggleFeedPublish, deleteFeedItem } from "./actions";
import styles from "../admin.module.css";

const DISCOVERY_LABEL: Record<string, string> = {
  manual: "Manual",
  curated: "Curated channel",
  search: "Open search",
};

export default async function AdminFeedPage() {
  const { supabase } = await requireAdmin();
  const { data: items } = await supabase
    .from("feed_items")
    .select("id, type, title, cover_url, discovery, is_published, release_date, is_english")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Journal feed</h2>
        <Link href="/admin/feed/new" className={styles.linkBtn}>
          + New item
        </Link>
      </div>

      {!items || items.length === 0 ? (
        <p className={styles.empty}>
          Nothing yet — the daily sync (see /api/cron/feed-sync) will drop candidates here as drafts once
          YOUTUBE_API_KEY and ANTHROPIC_API_KEY are set, or add one by hand.
        </p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Title</th>
                <th>Type</th>
                <th>Source</th>
                <th>Lang</th>
                <th>Release date</th>
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
                  <td className={styles.rowMeta}>{item.type}</td>
                  <td className={styles.rowMeta}>{DISCOVERY_LABEL[item.discovery] ?? item.discovery}</td>
                  <td className={styles.rowMeta}>{item.is_english ? "EN" : "—"}</td>
                  <td className={styles.rowMeta}>{item.release_date ? formatDate(item.release_date) : "—"}</td>
                  <td>
                    <PublishBadge isPublished={item.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/feed/${item.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleFeedPublish.bind(null, item.id, !item.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {item.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteFeedItem.bind(null, item.id)}>
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
