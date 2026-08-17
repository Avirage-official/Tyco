import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewBadge } from "@/components/ui/NewBadge";
import { createClient } from "@/lib/supabase/server";
import { isNew } from "@/lib/format";
import type { CreatorType } from "@/lib/supabase/types";
import styles from "./studio.module.css";

export const metadata: Metadata = { title: "Creators" };

const TYPE_LABELS: Record<CreatorType, string> = {
  musician: "Musician",
  visual_artist: "Visual artist",
  influencer: "Influencer",
  designer: "Designer",
  photographer: "Photographer",
  other: "Creator",
};

export default async function StudioCreatorsPage() {
  const supabase = await createClient();
  const { data: creators } = await supabase
    .from("creators")
    .select("slug, name, type, tagline, avatar_url, banner_url, published_at")
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  if (!creators || creators.length === 0) {
    return (
      <EmptyState
        title="No creators yet"
        description="Creator profiles published from Supabase will appear here as a gallery."
      />
    );
  }

  return (
    <div className={styles.grid}>
      {creators.map((creator) => (
        <Link key={creator.slug} href={`/creators/${creator.slug}`} className={styles.card}>
          <div
            className={styles.cardMedia}
            style={
              (creator.banner_url ?? creator.avatar_url)
                ? { backgroundImage: `url(${creator.banner_url ?? creator.avatar_url})` }
                : undefined
            }
          />
          <div className={styles.cardBody}>
            <p className={styles.cardCategory}>{TYPE_LABELS[creator.type as CreatorType]}</p>
            <h3 className={styles.cardTitle}>
              {creator.name} {isNew(creator.published_at) && <NewBadge />}
            </h3>
            {creator.tagline && <p className={styles.cardTagline}>{creator.tagline}</p>}
          </div>
        </Link>
      ))}
    </div>
  );
}
