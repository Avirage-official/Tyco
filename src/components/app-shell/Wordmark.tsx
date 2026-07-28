import Link from "next/link";
import styles from "./Wordmark.module.css";

export function Wordmark() {
  return (
    <Link href="/" className={styles.mark} aria-label="Tyco home">
      Tyc<em>o</em>
      <span className={styles.dot} aria-hidden />
    </Link>
  );
}
