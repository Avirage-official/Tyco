import styles from "./Loader.module.css";

export function Loader({ size = 36 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      className={styles.spinner}
      role="status"
      aria-label="Loading"
    >
      <circle cx="30" cy="30" r="24" className={styles.track} pathLength={1} />
      <g className={styles.orbit}>
        <circle cx="30" cy="30" r="24" className={styles.arc} pathLength={1} />
        <circle cx="30" cy="6" r="2.6" className={styles.dot} />
      </g>
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className={styles.page}>
      <Loader size={40} />
    </div>
  );
}
