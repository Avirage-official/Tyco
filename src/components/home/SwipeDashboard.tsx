"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShopCard, type ShopItem } from "@/components/home/FeaturedShop";
import { IconArrowRight } from "@/components/icons";
import type { DashboardSlideImages, DashboardSlideVisibility, EventSlide } from "@/lib/supabase/types";
import { formatEventDateTime, formatPrice } from "@/lib/format";
import styles from "./SwipeDashboard.module.css";

export type DealPreview = {
  id: string;
  title: string;
  vendorName: string;
  cover_url: string | null;
  member_price_cents: number;
  currency: string;
};

const LABELS = ["Retail", "Happenings"];

function ComingSoon({ note }: { note: string }) {
  return (
    <div className={styles.comingSoon}>
      <p className={styles.comingSoonText}>Coming soon.</p>
      <p className={styles.emptyNote}>{note}</p>
    </div>
  );
}

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
  deals,
  slideImages,
  hiddenSlides,
  initialSlide = 0,
}: {
  shopItems: ShopItem[];
  events: EventSlide[];
  deals: DealPreview[];
  slideImages?: DashboardSlideImages;
  hiddenSlides?: DashboardSlideVisibility;
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
          href={hiddenSlides?.retail ? undefined : "/shop"}
          linkLabel={hiddenSlides?.retail ? undefined : "Shop all"}
        >
          {hiddenSlides?.retail ? (
            <ComingSoon note="The rack is being refreshed — check back shortly." />
          ) : shopItems.length > 0 ? (
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
          href={hiddenSlides?.happenings ? undefined : "/studio"}
          linkLabel={hiddenSlides?.happenings ? undefined : "See all happenings"}
        >
          {hiddenSlides?.happenings ? (
            <ComingSoon note="The calendar is being updated — check back shortly." />
          ) : (
            <div className={styles.happeningsSplit}>
              <div className={styles.happeningsColumn}>
                <p className={styles.happeningsColumnLabel}>Events</p>
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
              </div>

              <div className={styles.happeningsColumn}>
                <p className={styles.happeningsColumnLabel}>Deals</p>
                {deals.length > 0 ? (
                  <div className={styles.eventList}>
                    {deals.slice(0, 2).map((deal) => (
                      <Link key={deal.id} href="/studio" className={styles.eventCard}>
                        <span
                          className={styles.eventCover}
                          style={deal.cover_url ? { backgroundImage: `url(${deal.cover_url})` } : undefined}
                          aria-hidden
                        />
                        <span className={styles.eventBody}>
                          <span className={styles.eventTitle}>{deal.title}</span>
                          <span className={styles.eventMeta}>
                            {deal.vendorName} — {formatPrice(deal.member_price_cents, deal.currency)}
                          </span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyNote}>New deals are on their way.</p>
                )}
              </div>
            </div>
          )}
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
