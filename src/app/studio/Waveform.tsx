import styles from "./studio.module.css";

/**
 * Decorative, ambient bar animation — no audio behind it. Shown on hover
 * over an event card (a nod to the collective's music side), driven purely
 * by the parent .eventCard:hover rule in studio.module.css so it shares
 * scope with that class. Not used on deal cards, which stay on the plain
 * poster-card hover treatment.
 */
export function Waveform() {
  return (
    <span className={styles.waveform} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className={styles.waveformBar} />
      ))}
    </span>
  );
}
