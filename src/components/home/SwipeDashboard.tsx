"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShopCard, type ShopItem } from "@/components/home/FeaturedShop";
import { IconArrowRight } from "@/components/icons";
import type { CreatorType, DashboardSlideImages, EventSlide } from "@/lib/supabase/types";
import { formatEventDateTime } from "@/lib/format";
import styles from "./SwipeDashboard.module.css";

export type CreatorPreview = {
  slug: string;
  name: string;
  type: CreatorType;
  tagline: string | null;
  avatar_url: string | null;
  banner_url: string | null;
};

const CREATOR_TYPE_LABELS: Record<CreatorType, string> = {
  musician: "Musician",
  visual_artist: "Visual artist",
  influencer: "Influencer",
  designer: "Designer",
  photographer: "Photographer",
  other: "Creator",
};

const LABELS = ["Retail", "Happenings", "Creators", "Services"];

function SlideFrame({
  index,
  active,
  eyebrow,
  title,
  image,
  href,
  linkLabel,
  children,
}: {
  index: number;
  active: boolean;
  eyebrow: string;
  title: string;
  image?: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.slide}>
      {image && (
        <div className={styles.slideBg} aria-hidden>
          <span className={styles.slideBgImage} style={{ backgroundImage: `url(${image})` }} />
          <span className={styles.slideBgScrim} />
        </div>
      )}
      <div className={styles.slideInner} data-active={active}>
        <div className={styles.slideHead}>
          <div className={styles.index}>
            <span className={styles.indexNum}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.indexDash} aria-hidden />
            <span className={styles.indexLabel}>{eyebrow}</span>
          </div>
          <h2 className={styles.slideTitle}>{title}</h2>
        </div>

        <div className={styles.slideBody}>{children}</div>

        {href && linkLabel && (
          <Link href={href} className={styles.slideLink}>
            <span className={styles.slideLinkLabel}>{linkLabel}</span>
            <IconArrowRight className={styles.slideLinkIcon} />
          </Link>
        )}
      </div>
    </div>
  );
}

export function SwipeDashboard({
  shopItems,
  events,
  creators,
  slideImages,
  initialSlide = 0,
}: {
  shopItems: ShopItem[];
  events: EventSlide[];
  creators: CreatorPreview[];
  slideImages?: DashboardSlideImages;
  initialSlide?: number;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initialSlide);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);
  const isJumping = useRef(false);

  // Jump to the requested opening slide before first paint — no smooth
  // animation, no flash of slide 0 first (this page may not even be Retail).
  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track || initialSlide === 0) return;
    isJumping.current = true;
    track.scrollLeft = initialSlide * track.clientWidth;
    isJumping.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function movePillTo(el: HTMLElement | null | undefined) {
    if (!el || !railRef.current) return;
    const railRect = railRef.current.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setPill({ left: rect.left - railRect.left, width: rect.width });
  }

  useLayoutEffect(() => {
    const activeEl = railRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    movePillTo(activeEl);
  }, [active]);

  useEffect(() => {
    window.addEventListener("resize", () => {
      const activeEl = railRef.current?.querySelector<HTMLElement>('[data-active="true"]');
      movePillTo(activeEl);
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    function onScroll() {
      if (isJumping.current || !track) return;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      setActive((prev) => (prev === i ? prev : i));
    }

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  function goTo(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(LABELS.length - 1, i));
    isJumping.current = true;
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
    setActive(clamped);
    window.setTimeout(() => {
      isJumping.current = false;
    }, 600);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") goTo(active + 1);
    if (e.key === "ArrowLeft") goTo(active - 1);
  }

  return (
    <section
      className={styles.wrap}
      aria-label="Explore Tyco"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className={styles.track} ref={trackRef}>
        <SlideFrame
          index={0}
          active={active === 0}
          eyebrow="Retail"
          title="Wear the collective"
          image={slideImages?.retail}
          href="/shop"
          linkLabel="Shop all"
        >
          {shopItems.length > 0 ? (
            <div className={styles.shopGrid}>
              {shopItems.slice(0, 4).map((item, i) => (
                <ShopCard key={item.id} item={item} position={i} />
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>New pieces are on their way to the rack.</p>
          )}
        </SlideFrame>

        <SlideFrame
          index={1}
          active={active === 1}
          eyebrow="Happenings"
          title="What's on next"
          image={slideImages?.happenings}
          href="/studio"
          linkLabel="See all happenings"
        >
          {events.length > 0 ? (
            <div className={styles.eventList}>
              {events.slice(0, 2).map((ev) => (
                <Link key={ev.id} href="/studio" className={styles.eventCard}>
                  <span
                    className={styles.eventCover}
                    style={ev.cover_url ? { backgroundImage: `url(${ev.cover_url})` } : undefined}
                    aria-hidden
                  />
                  <span className={styles.eventBody}>
                    <span className={styles.eventTitle}>{ev.title}</span>
                    <span className={styles.eventMeta}>
                      {[formatEventDateTime(ev.event_date), ev.location].filter(Boolean).join(" — ")}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>Nothing on the calendar yet — check back soon.</p>
          )}
        </SlideFrame>

        <SlideFrame
          index={2}
          active={active === 2}
          eyebrow="Creators"
          title="The roster"
          image={slideImages?.creators}
          href="/creators"
          linkLabel="Meet the roster"
        >
          {creators.length > 0 ? (
            <div className={styles.creatorRow}>
              {creators.slice(0, 3).map((creator) => (
                <Link key={creator.slug} href={`/creators/${creator.slug}`} className={styles.creatorCard}>
                  <span
                    className={styles.creatorMedia}
                    style={
                      (creator.avatar_url ?? creator.banner_url)
                        ? { backgroundImage: `url(${creator.avatar_url ?? creator.banner_url})` }
                        : undefined
                    }
                  />
                  <span className={styles.creatorType}>{CREATOR_TYPE_LABELS[creator.type]}</span>
                  <span className={styles.creatorName}>{creator.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className={styles.emptyNote}>The roster is filling up.</p>
          )}
        </SlideFrame>

        <SlideFrame
          index={3}
          active={active === 3}
          eyebrow="Services"
          title="Our services"
          image={slideImages?.services}
        >
          <div className={styles.comingSoon}>
            <p className={styles.comingSoonText}>Coming soon.</p>
            <p className={styles.emptyNote}>New ways to work with the collective, on the way.</p>
          </div>
        </SlideFrame>
      </div>

      <div className={styles.nav}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Previous"
        >
          <IconArrowRight className={styles.arrowLeft} />
        </button>

        <div ref={railRef} className={styles.tabs} role="tablist" aria-label="Sections">
          {pill && (
            <span
              className={styles.tabPill}
              style={{ transform: `translateX(${pill.left}px)`, width: pill.width }}
              aria-hidden
            />
          )}
          {LABELS.map((label, i) => (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={styles.tab}
              data-active={i === active}
              onClick={() => goTo(i)}
            >
              <span className={styles.tabNum}>{String(i + 1).padStart(2, "0")}</span>
              <span className={styles.tabLabel}>{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className={styles.arrow}
          onClick={() => goTo(active + 1)}
          disabled={active === LABELS.length - 1}
          aria-label="Next"
        >
          <IconArrowRight />
        </button>
      </div>
    </section>
  );
}
