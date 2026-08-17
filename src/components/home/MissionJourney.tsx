import Link from "next/link";
import { IconArrowRight, IconBoat } from "@/components/icons";
import styles from "./MissionJourney.module.css";

export function MissionJourney({ blurb }: { blurb: string | null }) {
  if (!blurb) return null;

  return (
    <section className={styles.wrap} aria-label="Our mission">
      <div className={`container ${styles.content}`}>
        <p className="eyebrow">The mission</p>
        <p className={styles.blurb}>{blurb}</p>
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
