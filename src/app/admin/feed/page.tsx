import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { FeedTable } from "./FeedTable";
import { SyncButton } from "./SyncButton";
import styles from "../admin.module.css";

// The "Run sync now" button below calls a server action that runs the same
// discover/classify/insert pipeline as the cron route, which can take well
// past the 10s default when working through a backlog — see run-sync.ts.
export const maxDuration = 60;

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
        <div className={styles.headerRowActions}>
          <Link href="/admin/feed/new" className={styles.linkBtn}>
            + New item
          </Link>
          <SyncButton />
        </div>
      </div>

      {!items || items.length === 0 ? (
        <p className={styles.empty}>
          Nothing yet — hit &ldquo;Run sync now&rdquo; above, or wait for the monthly sync (see
          /api/cron/feed-sync) once YOUTUBE_API_KEY and ANTHROPIC_API_KEY are set, or add one by hand.
        </p>
      ) : (
        <FeedTable items={items} />
      )}
    </div>
  );
}
