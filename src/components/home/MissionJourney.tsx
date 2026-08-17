import Link from "next/link";
import { IconArrowRight, IconBoat } from "@/components/icons";
import { formatPrice } from "@/lib/format";
import styles from "./MissionJourney.module.css";

const REVEAL_THRESHOLD_PCT = 50;

export function MissionJourney({
  blurb,
  raisedCents,
  goalCents,
}: {
  blurb: string | null;
  raisedCents: number;
  goalCents: number;
}) {
  if (!blurb) return null;

  const pct = goalCents > 0 ? Math.min(100, Math.round((raisedCents / goalCents) * 100)) : 0;

  return (
    <section className={styles.wrap} aria-label="Our mission">
      <div className={`container ${styles.content}`}>
        <p className="eyebrow">The mission</p>
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

      <div className={styles.scene} aria-hidden>
        <span className={styles.horizonGlow} />
        <span className={styles.horizonLine} />
        <div className={styles.boatTrack}>
          <span className={styles.boatBob}>
            <span className={styles.wake} />
            <IconBoat className={styles.boat} />
          </span>
        </div>
      </div>
    </section>
  );
}
