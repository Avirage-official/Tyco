import Image from "next/image";
import styles from "./Pass.module.css";

export type PassTone = "ready" | "done" | "refused" | "muted";

/**
 * One anatomy for everything a member holds and shows to staff — an event
 * ticket, a deal redemption. A flat panel on a tight grid: the gutters do
 * the containing, so the tile needs no shape, fill contrast or shadow of
 * its own.
 *
 * Reading order follows what happens at a counter: what state it's in, then
 * what it is, then *who holds it*, because staff verify the person before
 * anything else. The reference code is the admin fallback — staff type
 * their own name, they never read it — so it sits last, as small print.
 */
export function Pass({
  artworkUrl,
  artworkAlt,
  status,
  tone = "ready",
  date,
  title,
  holderName,
  code,
  children,
  highlight = false,
}: {
  artworkUrl: string | null;
  artworkAlt: string;
  /** The small label top-left: Ready, Redeemed, Declined, Payment pending. */
  status: string;
  tone?: PassTone;
  date: string;
  title: string;
  holderName: string;
  code: string;
  /** The action, or the settled state — rendered flush to the tile's edges. */
  children?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <article className={highlight ? `${styles.pass} ${styles.highlight}` : styles.pass}>
      <div className={styles.top}>
        <span className={styles.mark}>
          {artworkUrl ? (
            <Image src={artworkUrl} alt={artworkAlt} fill sizes="56px" className={styles.markImg} />
          ) : (
            <span className={styles.markEmpty} aria-label={artworkAlt} role="img" />
          )}
        </span>
        <span className={styles.date}>{date}</span>
      </div>

      <p className={`${styles.status} ${styles[tone]}`}>{status}</p>
      <h3 className={styles.title}>{title}</h3>

      <div className={styles.foot}>
        <p className={styles.holderLabel}>Held by</p>
        <p className={styles.holder}>{holderName}</p>
        <p className={styles.code}>{code}</p>
      </div>

      {children && <div className={styles.slot}>{children}</div>}
    </article>
  );
}
