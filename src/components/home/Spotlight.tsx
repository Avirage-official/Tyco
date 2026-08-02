import Link from "next/link";
import { formatDate } from "@/lib/format";
import styles from "./Spotlight.module.css";

type SpotlightProps =
  | {
      kind: "event";
      href: string;
      title: string;
      location: string | null;
      date: string;
    }
  | {
      kind: "release";
      href: string;
      title: string;
      artist: string;
      coverUrl: string | null;
      date: string;
    };

export function Spotlight(props: SpotlightProps) {
  const label = props.kind === "event" ? "Next up" : "Latest release";

  return (
    <Link href={props.href} className={styles.spotlight}>
      {props.kind === "release" && (
        <span
          className={styles.cover}
          style={props.coverUrl ? { backgroundImage: `url(${props.coverUrl})` } : undefined}
          aria-hidden
        />
      )}
      <div className={styles.body}>
        <span className={styles.label}>
          <span className={styles.dot} aria-hidden />
          {label}
        </span>
        <h2 className={styles.title}>{props.title}</h2>
        <p className={styles.meta}>
          {props.kind === "event"
            ? [formatDate(props.date), props.location].filter(Boolean).join(" · ")
            : [props.artist, formatDate(props.date)].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
