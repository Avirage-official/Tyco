import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { createClient } from "@/lib/supabase/server";
import type { CreatorType } from "@/lib/supabase/types";
import styles from "./creators.module.css";

export const metadata: Metadata = { title: "Creators" };

const TYPE_LABELS: Record<CreatorType, string> = {
  musician: "Musician",
  visual_artist: "Visual artist",
  influencer: "Influencer",
  designer: "Designer",
  photographer: "Photographer",
  other: "Creator",
};

export default async function CreatorsDirectoryPage() {
  const supabase = await createClient();
  const { data: creators } = await supabase
    .from("creators")
    .select("slug, name, type, tagline, avatar_url, banner_url")
    .eq("is_published", true)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        eyebrow="The roster"
        title="Creators"
        description="The artists, designers, and creatives building under the Tyco house — each with their own space to tell their story and sell their work."
      />
      <div className="container">
        {creators && creators.length > 0 ? (
          <div className={styles.grid}>
            {creators.map((creator) => (
              <Link key={creator.slug} href={`/creators/${creator.slug}`} className={styles.card}>
                <div
                  className={styles.media}
                  style={
                    (creator.avatar_url ?? creator.banner_url)
                      ? { backgroundImage: `url(${creator.avatar_url ?? creator.banner_url})` }
                      : undefined
                  }
                />
                <div className={styles.body}>
                  <span className={styles.type}>{TYPE_LABELS[creator.type]}</span>
                  <span className={styles.name}>{creator.name}</span>
                  {creator.tagline && <span className={styles.tagline}>{creator.tagline}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="The roster is filling up"
            description="Creators published from the admin will show up here, each with their own page."
          />
        )}
      </div>
    </>
  );
}
