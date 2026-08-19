"use client";

import Link from "next/link";
import { SmoothScroll } from "@/lib/motion/SmoothScroll";
import { useRevealOnScroll } from "@/lib/motion/useScrollReveal";
import { detectPostEmbedPlatform, toYouTubeEmbedUrl } from "@/lib/embeds";
import { formatPrice, isNew } from "@/lib/format";
import { NewBadge } from "@/components/ui/NewBadge";
import type { AboutSlide, CreatorType } from "@/lib/supabase/types";
import { Chapter } from "./Chapter";
import { PostEmbed } from "./PostEmbed";
import { SpotifyWidget } from "./SpotifyWidget";
import styles from "./CreatorPage.module.css";

const TYPE_LABELS: Record<CreatorType, string> = {
  musician: "Musician",
  visual_artist: "Visual artist",
  influencer: "Influencer",
  designer: "Designer",
  photographer: "Photographer",
  other: "Creator",
};

type Creator = {
  id: string;
  slug: string;
  name: string;
  type: CreatorType;
  tagline: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  youtube_url: string | null;
  spotify_url: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  gallery: AboutSlide[];
};

type Work = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  external_url: string | null;
};

type Product = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  images: string[];
  published_at: string | null;
};

function LinkRow({ creator }: { creator: Creator }) {
  const links = [
    { url: creator.instagram_url, label: "Instagram" },
    { url: creator.tiktok_url, label: "TikTok" },
    { url: creator.website_url, label: "Website" },
  ].filter((link): link is { url: string; label: string } => Boolean(link.url));

  if (links.length === 0) return null;

  return (
    <div className={styles.linkRow}>
      {links.map((link) => (
        <a key={link.label} href={link.url} target="_blank" rel="noreferrer" className={styles.chip}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

export function CreatorPage({
  creator,
  works,
  products,
}: {
  creator: Creator;
  works: Work[];
  products: Product[];
}) {
  const heroRef = useRevealOnScroll<HTMLDivElement>();
  const youtubeEmbedUrl = creator.youtube_url ? toYouTubeEmbedUrl(creator.youtube_url) : null;
  const [firstGalleryItem, ...restGallery] = creator.gallery;

  return (
    <SmoothScroll>
      <div className={styles.page}>
        <section
          className={styles.hero}
          style={creator.banner_url ? { backgroundImage: `url(${creator.banner_url})` } : undefined}
        >
          <div className={styles.heroScrim} aria-hidden />
          <div ref={heroRef} className={styles.heroInner}>
            <p className="eyebrow">
              {TYPE_LABELS[creator.type]}
              {creator.location ? ` · ${creator.location}` : ""}
            </p>
            <h1 className={styles.heroTitle}>{creator.name}</h1>
            {creator.tagline && <p className={styles.heroTagline}>{creator.tagline}</p>}
          </div>
        </section>

        {(creator.bio || firstGalleryItem) && (
          <Chapter background={firstGalleryItem}>
            <div className={styles.chapterCard}>
              {creator.bio && <p className={styles.bio}>{creator.bio}</p>}
              <LinkRow creator={creator} />
            </div>
          </Chapter>
        )}

        {restGallery.map((item) => (
          <Chapter key={item.url} background={item} />
        ))}

        {works.map((work) => {
          const postEmbedPlatform = work.external_url ? detectPostEmbedPlatform(work.external_url) : null;
          return (
            <Chapter
              key={work.id}
              background={work.cover_url ? { url: work.cover_url, type: "image" } : undefined}
            >
              <div className={styles.chapterCard}>
                <p className="eyebrow">Works</p>
                <h2 className={styles.workTitle}>{work.title}</h2>
                {work.description && <p className={styles.bio}>{work.description}</p>}
                {work.external_url &&
                  (postEmbedPlatform ? (
                    <PostEmbed url={work.external_url} className={styles.embedWrap} />
                  ) : (
                    <a href={work.external_url} target="_blank" rel="noreferrer" className={styles.chip}>
                      View
                    </a>
                  ))}
              </div>
            </Chapter>
          );
        })}

        {youtubeEmbedUrl && (
          <section className={`container ${styles.youtubeSection}`}>
            <p className="eyebrow">Watch</p>
            <div className={styles.youtubeFrame}>
              <iframe
                src={youtubeEmbedUrl}
                title={`${creator.name} on YouTube`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </section>
        )}

        {products.length > 0 && (
          <section className={`container ${styles.shopSection}`}>
            <p className="eyebrow">From {creator.name}</p>
            <h2 className={styles.shopTitle}>Shop</h2>
            <div className={styles.shopGrid}>
              {products.map((product) => (
                <Link key={product.id} href={`/shop/${product.id}`} className={styles.productCard}>
                  <div
                    className={styles.productMedia}
                    style={product.images?.[0] ? { backgroundImage: `url(${product.images[0]})` } : undefined}
                  />
                  <div className={styles.productBody}>
                    <span className={styles.productName}>
                      {product.name} {isNew(product.published_at) && <NewBadge />}
                    </span>
                    <span className={styles.productPrice}>{formatPrice(product.price_cents, product.currency)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {creator.spotify_url && <SpotifyWidget url={creator.spotify_url} name={creator.name} />}
    </SmoothScroll>
  );
}
