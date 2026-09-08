import type { Metadata } from "next";
import { EmptyState } from "@/components/ui/EmptyState";
import { Marquee } from "@/components/motion/Marquee";
import { createClient } from "@/lib/supabase/server";
import { JournalList, type JournalEntry } from "./JournalList";
import styles from "./journal.module.css";

export const metadata: Metadata = { title: "Journal" };

const MARQUEE_ITEMS = ["New Releases", "Southeast Asia", "The Journal", "Tyco"];
const MERGED_LIMIT = 12;

export default async function JournalPage() {
  const supabase = await createClient();

  const [{ data: feedItems }, { data: events }, { data: products }] = await Promise.all([
    supabase
      .from("feed_items")
      .select("id, type, title, body, cover_url, source_url, source_channel, release_date, published_at, is_english")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(60),
    supabase
      .from("events")
      .select("id, title, description, cover_url, event_date, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(MERGED_LIMIT),
    supabase
      .from("products")
      .select("id, name, description, images, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(MERGED_LIMIT),
  ]);

  const entries: JournalEntry[] = [
    ...(feedItems ?? []).map((item): JournalEntry => ({
      id: `feed-${item.id}`,
      kind: item.type,
      title: item.title,
      description: item.body,
      coverUrl: item.cover_url,
      date: item.release_date ?? item.published_at ?? new Date(0).toISOString(),
      href: item.source_url,
      meta: item.source_channel,
      isEnglish: item.is_english,
    })),
    ...(events ?? []).map((event): JournalEntry => ({
      id: `event-${event.id}`,
      kind: "event",
      title: event.title,
      description: event.description,
      coverUrl: event.cover_url,
      date: event.published_at ?? event.event_date,
      href: "/studio",
      meta: null,
    })),
    ...(products ?? []).map((product): JournalEntry => ({
      id: `product-${product.id}`,
      kind: "product",
      title: product.name,
      description: product.description,
      coverUrl: product.images?.[0] ?? null,
      date: product.published_at ?? new Date(0).toISOString(),
      href: `/shop/${product.id}`,
      meta: null,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <>
      <Marquee items={MARQUEE_ITEMS} />

      <div className={styles.journalBody}>
        <div className={styles.pageHead}>
          <p className="eyebrow">The studio journal</p>
          <h1 className={styles.pageHeadTitle}>Journal</h1>
          <p className={styles.pageHeadDesc}>
            New releases from the Southeast Asian scene, alongside every happening and drop from the
            collective — one running log.
          </p>
        </div>

        {entries.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="New releases and news from the scene will show up here as they're published."
          />
        ) : (
          <JournalList entries={entries} />
        )}
      </div>
    </>
  );
}
