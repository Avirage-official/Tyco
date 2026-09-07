import styles from "./Marquee.module.css";

/**
 * A seamlessly looping strip used as the transition between sections —
 * the "divider" here is moving content, never a static ruled line. The
 * item list is duplicated once so the scroll loop has no visible seam;
 * the whole thing is decorative (aria-hidden) since it repeats the page's
 * own section labels rather than adding information.
 */
export function Marquee({ items }: { items: string[] }) {
  const track = [...items, ...items];

  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={styles.track}>
        {track.map((item, i) => (
          <span className={styles.item} key={i}>
            {item}
            <span className={styles.dot} />
          </span>
        ))}
      </div>
    </div>
  );
}
