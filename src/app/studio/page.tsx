import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewBadge } from "@/components/ui/NewBadge";
import { createClient } from "@/lib/supabase/server";
import { isNew } from "@/lib/format";
import styles from "./studio.module.css";

export const metadata: Metadata = { title: "Studio" };

export default async function StudioWorkPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, title, category, cover_url, published_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="Nothing posted yet"
        description="Creative updates and projects published from Supabase will appear here as a gallery."
      />
    );
  }

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <article key={item.id} className={styles.card}>
          <div
            className={styles.cardMedia}
            style={item.cover_url ? { backgroundImage: `url(${item.cover_url})` } : undefined}
          />
          <div className={styles.cardBody}>
            {item.category && <p className={styles.cardCategory}>{item.category}</p>}
            <h3 className={styles.cardTitle}>
              {item.title} {isNew(item.published_at) && <NewBadge />}
            </h3>
          </div>
        </article>
      ))}
    </div>
  );
}
