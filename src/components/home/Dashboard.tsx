import { Fragment } from "react";
import Link from "next/link";
import { VideoHero } from "@/components/home/VideoHero";
import { Slideshow } from "@/components/home/Slideshow";
import { FeaturedShop, type ShopItem } from "@/components/home/FeaturedShop";
import { MissionEventSplit, type EventSlide } from "@/components/home/MissionEventSplit";
import type { AboutSlide } from "@/lib/supabase/types";
import { formatEventDateTime } from "@/lib/format";
import styles from "./Dashboard.module.css";

export type DashboardProps = {
  name: string;
  events: EventSlide[];
  nextProject: { title: string; body: string | null; imageUrl: string | null } | null;
  missionBlurb: string | null;
  missionRaisedCents: number;
  missionGoalCents: number;
  ambientImages: string[];
  slides: AboutSlide[];
  orderCount: number;
  shopItems: ShopItem[];
};

export function Dashboard({
  name,
  events,
  nextProject,
  missionBlurb,
  missionRaisedCents,
  missionGoalCents,
  ambientImages,
  slides,
  orderCount,
  shopItems,
}: DashboardProps) {
  const passes = [{ href: "/account/orders", label: "Order", count: orderCount, type: "History" }];

  const tickerItems: string[] = [];
  if (events[0]) {
    tickerItems.push(
      `NEXT UP — ${events[0].title.toUpperCase()}, ${formatEventDateTime(events[0].event_date).toUpperCase()}`
    );
  }
  if (nextProject) {
    tickerItems.push(`COMING NEXT — ${nextProject.title.toUpperCase()}`);
  }
  if (tickerItems.length === 0) {
    tickerItems.push("WELCOME TO TYCO — SOUND, STYLE, AND CULTURE");
  }
  const tickerTrack = [...tickerItems, ...tickerItems];

  const filmFrames = ambientImages.length > 0 ? [...ambientImages, ...ambientImages] : [];

  return (
    <>
      <VideoHero size="compact">
        <p className="eyebrow">Tyco</p>
        <h1 className={styles.heroTitle}>Welcome back, {name}</h1>
      </VideoHero>

      {tickerItems.length > 0 && (
        <div className={styles.ticker}>
          <div className={styles.tickerTrack}>
            {tickerTrack.map((text, i) => (
              <Fragment key={i}>
                <span>{text}</span>
                <span className={styles.sep} aria-hidden>
                  /
                </span>
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {filmFrames.length > 0 && (
        <div className={styles.filmStrip} aria-hidden>
          <div className={styles.sprocketRow} />
          <div className={styles.filmTrack}>
            {filmFrames.map((url, i) => (
              <span key={i} className={styles.filmFrame} style={{ backgroundImage: `url(${url})` }} />
            ))}
          </div>
          <div className={styles.sprocketRow} />
        </div>
      )}

      <FeaturedShop items={shopItems} />

      <MissionEventSplit
        blurb={missionBlurb}
        raisedCents={missionRaisedCents}
        goalCents={missionGoalCents}
        events={events}
      />

      <div className={`container ${styles.wrap}`}>
        {nextProject && (
          <div className={styles.secondary}>
            <Link href="/studio" className={styles.postcard} style={{ gridColumn: "1 / -1" }}>
              <p className={styles.stamp}>Coming next</p>
              <h2 className={styles.postcardTitle}>{nextProject.title}</h2>
              {nextProject.body && <p className={styles.postcardMeta}>{nextProject.body}</p>}
            </Link>
          </div>
        )}
      </div>

      {slides.length > 0 && <Slideshow slides={slides} />}

      <div className={`container ${styles.wrap}`} style={{ paddingTop: slides.length > 0 ? "var(--space-2xl)" : 0 }}>
        <div className={styles.passHead}>
          <p className="eyebrow">Quick access</p>
          <h2>Your shortcuts</h2>
        </div>
        <div className={styles.passRow}>
          {passes.map((p) => (
            <Link key={p.type} href={p.href} className={styles.pass}>
              <span className={styles.grommet} aria-hidden />
              <p className={styles.passLabel}>{p.label}</p>
              <p className={styles.passCount}>{p.count}</p>
              <p className={styles.passType}>{p.type}</p>
              <span className={styles.passStrip} aria-hidden />
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
