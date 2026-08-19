import Link from "next/link";
import { formatEventDateTime } from "@/lib/format";
import styles from "./Spotlight.module.css";

export type SpotlightProps = {
  kind: "event";
  href: string;
  title: string;
  location: string | null;
  organizer: string | null;
  date: string;
  coverUrl: string | null;
};

export function Spotlight(props: SpotlightProps) {
  return (
    <Link href={props.href} className={styles.spotlight}>
      <span
        className={styles.cover}
        style={props.coverUrl ? { backgroundImage: `url(${props.coverUrl})` } : undefined}
        aria-hidden
      />
      <div className={styles.body}>
        <span className={styles.label}>
          <span className={styles.dot} aria-hidden />
          Next up
        </span>
        <h2 className={styles.title}>{props.title}</h2>
        <p className={styles.meta}>
          {[formatEventDateTime(props.date), props.location].filter(Boolean).join(" · ")}
        </p>
        {props.organizer && <p className={styles.meta}>Hosted by {props.organizer}</p>}
      </div>
    </Link>
  );
}
