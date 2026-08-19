import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { NewBadge } from "@/components/ui/NewBadge";
import { IconArrowRight } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { isNew } from "@/lib/format";
import type { CreatorType } from "@/lib/supabase/types";
import styles from "../studio.module.css";

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

  const [featured, ...rest] = creators;

  return (
    <div>
      <Link href={`/creators/${featured.slug}`} className={styles.creatorHero}>
        <span
          className={styles.creatorHeroMedia}
          style={
            (featured.banner_url ?? featured.avatar_url)
              ? { backgroundImage: `url(${featured.banner_url ?? featured.avatar_url})` }
              : undefined
          }
          aria-hidden
        />
        <span className={styles.creatorHeroScrim} aria-hidden />
        <div className={`container ${styles.creatorHeroBody}`}>
          <p className={styles.creatorHeroType}>{TYPE_LABELS[featured.type as CreatorType]}</p>
          <h2 className={styles.creatorHeroName}>
            {featured.name} {isNew(featured.published_at) && <NewBadge />}
          </h2>
          {featured.tagline && <p className={styles.creatorHeroTagline}>{featured.tagline}</p>}
          <span className={styles.creatorHeroLink}>
            View profile <IconArrowRight />
          </span>
        </div>
      </Link>

      {rest.length > 0 && (
        <div className={styles.creatorGrid}>
          {rest.map((creator) => (
            <Link key={creator.slug} href={`/creators/${creator.slug}`} className={styles.posterCard}>
              <span
                className={styles.posterMedia}
                style={
                  (creator.banner_url ?? creator.avatar_url)
                    ? { backgroundImage: `url(${creator.banner_url ?? creator.avatar_url})` }
                    : undefined
                }
                aria-hidden
              />
              <span className={styles.posterScrim} aria-hidden />
              <div className={styles.posterBody}>
                <p className={styles.posterType}>{TYPE_LABELS[creator.type as CreatorType]}</p>
                <p className={styles.posterName}>
                  {creator.name} {isNew(creator.published_at) && <NewBadge />}
                </p>
                {creator.tagline && <p className={styles.posterTagline}>{creator.tagline}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
