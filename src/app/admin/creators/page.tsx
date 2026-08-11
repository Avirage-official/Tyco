import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { PublishBadge } from "../PublishBadge";
import { toggleCreatorPublish, deleteCreator } from "./actions";
import styles from "../admin.module.css";

const TYPE_LABELS: Record<string, string> = {
  musician: "Musician",
  visual_artist: "Visual artist",
  influencer: "Influencer",
  designer: "Designer",
  photographer: "Photographer",
  other: "Other",
};

export default async function AdminCreatorsPage() {
  const { supabase } = await requireAdmin();
  const { data: creators } = await supabase
    .from("creators")
    .select("id, name, type, avatar_url, is_published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Creators</h2>
        <Link href="/admin/creators/new" className={styles.linkBtn}>
          + New creator
        </Link>
      </div>

      {!creators || creators.length === 0 ? (
        <p className={styles.empty}>No creators yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th></th>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {creators.map((creator) => (
                <tr key={creator.id}>
                  <td>
                    <div
                      className={styles.rowThumb}
                      style={creator.avatar_url ? { backgroundImage: `url(${creator.avatar_url})` } : undefined}
                    />
                  </td>
                  <td className={styles.rowTitle}>{creator.name}</td>
                  <td className={styles.rowMeta}>{TYPE_LABELS[creator.type] ?? creator.type}</td>
                  <td>
                    <PublishBadge isPublished={creator.is_published} />
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/creators/${creator.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleCreatorPublish.bind(null, creator.id, !creator.is_published)}>
                        <button type="submit" className={styles.linkBtn}>
                          {creator.is_published ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteCreator.bind(null, creator.id)}>
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
