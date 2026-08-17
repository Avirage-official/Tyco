import { Fragment } from "react";
import Link from "next/link";
import { VideoHero } from "@/components/home/VideoHero";
import { Slideshow } from "@/components/home/Slideshow";
import { FeaturedShop, type ShopItem } from "@/components/home/FeaturedShop";
import { MissionJourney } from "@/components/home/MissionJourney";
import type { SpotlightProps } from "@/components/home/Spotlight";
import type { AboutSlide } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";
import styles from "./Dashboard.module.css";

export type DashboardProps = {
  name: string;
  event: SpotlightProps | null;
  nextProject: { title: string; body: string | null; imageUrl: string | null } | null;
  missionBlurb: string | null;
  ambientImages: string[];
  slides: AboutSlide[];
  orderCount: number;
  shopItems: ShopItem[];
};

function EventTicket({ item }: { item: SpotlightProps }) {
  return (
    <Link href={item.href} className={styles.ticket}>
      <div className={styles.ticketMain}>
        <p className={styles.stamp}>Next up</p>
        <h2 className={styles.ticketTitle}>{item.title}</h2>
        <p className={styles.ticketMeta}>
          {[formatDate(item.date), item.location].filter(Boolean).join(" — ")}
        </p>
      </div>
      <div className={styles.ticketDivider} aria-hidden />
      <div className={styles.ticketStub} aria-hidden>
        ADMIT ONE
      </div>
    </Link>
  );
}

export function Dashboard({
  name,
  event,
  nextProject,
  missionBlurb,
  ambientImages,
  slides,
  orderCount,
  shopItems,
}: DashboardProps) {
  const passes = [{ href: "/account/orders", label: "Order", count: orderCount, type: "History" }];

  const tickerItems: string[] = [];
  if (event) {
    tickerItems.push(`NEXT UP — ${event.title.toUpperCase()}, ${formatDate(event.date).toUpperCase()}`);
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

      <MissionJourney blurb={missionBlurb} />

      <div className={`container ${styles.wrap}`}>
        {event && (
          <div className={styles.board}>
            <EventTicket item={event} />
          </div>
        )}

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
