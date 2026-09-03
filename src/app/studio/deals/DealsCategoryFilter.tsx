import Link from "next/link";
import styles from "./DealsCategoryFilter.module.css";

export function DealsCategoryFilter({
  categories,
  activeId,
}: {
  categories: { id: string; name: string }[];
  activeId: string | null;
}) {
  if (categories.length < 2) return null;

  return (
    <nav aria-label="Filter deals by category" className={styles.filter}>
      <Link
        href="/studio/deals"
        className={!activeId ? `${styles.chip} ${styles.chipActive}` : styles.chip}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/studio/deals?category=${cat.id}`}
          className={activeId === cat.id ? `${styles.chip} ${styles.chipActive}` : styles.chip}
        >
          {cat.name}
        </Link>
      ))}
    </nav>
  );
}
