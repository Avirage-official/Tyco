import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { FeedTable } from "./FeedTable";
import styles from "../admin.module.css";

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
        <FeedTable items={items} />
      )}
    </div>
  );
}
