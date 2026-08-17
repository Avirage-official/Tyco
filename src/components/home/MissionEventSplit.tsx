"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconArrowRight, IconBoat } from "@/components/icons";
import { formatDate, formatPrice } from "@/lib/format";
import styles from "./MissionEventSplit.module.css";

export type EventSlide = {
  id: string;
  title: string;
  location: string | null;
  event_date: string;
  cover_url: string | null;
};

const REVEAL_THRESHOLD_PCT = 50;
const EVENT_CYCLE_MS = 6000;

function useSlideCycle(count: number) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setIndex((i) => (i + 1) % count), EVENT_CYCLE_MS);
    return () => clearInterval(id);
  }, [count]);

  return index;
}

export function MissionEventSplit({
  blurb,
  raisedCents,
  goalCents,
  events,
}: {
  blurb: string | null;
  raisedCents: number;
  goalCents: number;
  events: EventSlide[];
}) {
  const activeEvent = useSlideCycle(events.length);

  if (!blurb && events.length === 0) return null;

  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0;
  const showMission = Boolean(blurb);
  const showEvents = events.length > 0;
  const current = events[activeEvent];

  return (
    <section className={styles.wrap} aria-label="Mission and upcoming events">
      {showMission && (
        <div className={showEvents ? styles.mission : `${styles.mission} ${styles.solo}`}>
          <div className={styles.missionScene} aria-hidden>
            <span className={styles.horizonGlow} />
            <span className={styles.horizonLine} />
            <div className={styles.boatTrack}>
              <span className={styles.boatBob}>
                <span className={styles.wake} />
                <IconBoat className={styles.boat} />
              </span>
            </div>
          </div>

          <div className={styles.missionContent}>
            <p className={styles.eyebrow}>The mission</p>
            <p className={styles.blurb}>{blurb}</p>

            {goalCents > 0 &&
              (pct < REVEAL_THRESHOLD_PCT ? (
                <p className={styles.stage}>Just getting started. Challenge accepted.</p>
              ) : (
                <p className={styles.stage}>
                  {formatPrice(raisedCents)} raised toward {formatPrice(goalCents)}.
                </p>
              ))}

            <Link href="/about" className={styles.link}>
              The story so far <IconArrowRight />
            </Link>
          </div>
        </div>
      )}

      {showMission && showEvents && <span className={styles.divider} aria-hidden />}

      {showEvents && (
        <Link
          href="/studio/events"
          className={showMission ? styles.events : `${styles.events} ${styles.solo}`}
        >
          {events.map((ev, i) => (
            <span
              key={ev.id}
              className={styles.eventLayer}
              data-active={i === activeEvent}
              style={ev.cover_url ? { backgroundImage: `url(${ev.cover_url})` } : undefined}
            />
          ))}
          <span className={styles.eventScrim} aria-hidden />
          <span className={styles.eventBody}>
            <span className={styles.eyebrowLight}>Next up</span>
            <h2 className={styles.eventTitle}>{current.title}</h2>
            <p className={styles.eventMeta}>
              {[formatDate(current.event_date), current.location].filter(Boolean).join(" — ")}
            </p>
          </span>
        </Link>
      )}
    </section>
  );
}
