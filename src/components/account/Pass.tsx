import { CoverImage } from "@/components/ui/CoverImage";
import styles from "./Pass.module.css";

/**
 * One anatomy for everything a member holds and shows to staff — an event
 * ticket, a deal redemption. Wallet passes and paper tickets settle on the
 * same order for the same reason: what it is, when, and *who it belongs to*
 * on top, because staff verify the person in front of them before anything
 * else. The action comes next. Money, quantities and the reference code are
 * true but irrelevant at the counter, so they sit last, small.
 */
export function Pass({
  coverUrl,
  coverAlt,
  title,
  meta,
  holderName,
  status,
  children,
  footer,
  highlight = false,
}: {
  coverUrl: string | null;
  coverAlt: string;
  title: string;
  meta?: string;
  /** The member's own name — what staff check against the person present. */
  holderName: string;
  /** Payment state, when it isn't simply paid. */
  status?: React.ReactNode;
  /** The handover panel, or whatever action this pass currently needs. */
  children?: React.ReactNode;
  /** Reference code, totals — small print. */
  footer?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <article className={highlight ? `${styles.pass} ${styles.highlight}` : styles.pass}>
      <div className={styles.cover}>
        <CoverImage src={coverUrl} alt={coverAlt} sizes="(min-width: 760px) 520px, 100vw" />
      </div>

      <div className={styles.body}>
        <header className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          {meta && <p className={styles.meta}>{meta}</p>}
          {status}
        </header>

        <p className={styles.holder}>
          <span className={styles.holderLabel}>Held by</span>
          <span className={styles.holderName}>{holderName}</span>
        </p>

        {children}

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </article>
  );
}

/** Reference code, set as small print: it is the admin fallback, not the
 *  thing staff read — they type their own name instead. */
export function PassCode({ code, label = "Reference" }: { code: string; label?: string }) {
  return (
    <span className={styles.code}>
      {label} <b>{code}</b>
    </span>
  );
}
