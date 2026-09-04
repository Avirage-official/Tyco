import styles from "./StudioFeatureBanner.module.css";

/**
 * Placeholder for a featured spot between the Happenings/Deals switcher and
 * the page's own listing — content and design TBD, deliberately left as a
 * plain labeled placeholder rather than fabricated promo copy in the
 * meantime. Mobile-only (see .banner) — matches the tab switcher it sits
 * under, which is also mobile-only (desktop keeps its existing sidebar).
 */
export function StudioFeatureBanner() {
  return (
    <div className={styles.banner}>
      <p className={styles.eyebrow}>Featured</p>
      <p className={styles.text}>Coming soon</p>
    </div>
  );
}
