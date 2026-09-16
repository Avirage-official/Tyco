import styles from "./Skeleton.module.css";

/**
 * Grey blocks in the shape of the content they stand in for. Every
 * `loading.tsx` renders one of the page-level layouts below rather than a
 * spinner, so the page doesn't jump when real content arrives.
 */
export function Skeleton({
  width,
  height,
  radius = "sm",
  className,
}: {
  width?: string | number;
  height?: string | number;
  radius?: "sm" | "md" | "lg" | "pill";
  className?: string;
}) {
  return (
    <span
      className={[styles.block, styles[`r_${radius}`], className ?? ""].filter(Boolean).join(" ")}
      style={{ width, height }}
      aria-hidden
    />
  );
}

export function SkeletonText({ lines = 3, width = "100%" }: { lines?: number; width?: string }) {
  return (
    <span className={styles.text} style={{ width }} aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} height="0.9em" width={i === lines - 1 ? "60%" : "100%"} />
      ))}
    </span>
  );
}

function CardSkeleton() {
  return (
    <div className={styles.card}>
      <Skeleton className={styles.cardMedia} height="auto" width="100%" />
      <span className={styles.cardBody}>
        <Skeleton height="1.1rem" width="70%" />
        <Skeleton height="0.85rem" width="45%" />
      </span>
    </div>
  );
}

export type PageSkeletonKind = "grid" | "list" | "hero" | "form";

/**
 * Whole-page placeholders matching the four page shapes in the design
 * system: a card grid with a header, a vertical list, a hero followed by a
 * card row, and a centred form.
 */
export function PageSkeleton({ kind }: { kind: PageSkeletonKind }) {
  if (kind === "form") {
    return (
      <div className={styles.form} role="status" aria-label="Loading">
        <Skeleton height="1.8rem" width="50%" />
        <Skeleton height="2.75rem" radius="pill" />
        <Skeleton height="2.75rem" />
        <Skeleton height="2.75rem" />
        <Skeleton height="2.75rem" radius="pill" />
      </div>
    );
  }

  if (kind === "hero") {
    return (
      <div role="status" aria-label="Loading">
        <Skeleton className={styles.hero} height="auto" width="100%" radius="sm" />
        <div className={`container ${styles.section}`}>
          <Skeleton height="1.6rem" width="12rem" />
          <div className={styles.grid}>
            {Array.from({ length: 4 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (kind === "list") {
    return (
      <div className={`container ${styles.section}`} role="status" aria-label="Loading">
        <Skeleton height="2.2rem" width="14rem" />
        <div className={styles.list}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={styles.row}>
              <Skeleton width="4.5rem" height="4.5rem" radius="md" />
              <span className={styles.rowBody}>
                <Skeleton height="1.1rem" width="60%" />
                <Skeleton height="0.85rem" width="40%" />
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`container container--wide ${styles.section}`} role="status" aria-label="Loading">
      <Skeleton height="2.2rem" width="10rem" />
      <div className={styles.chips}>
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} height="2rem" width="5.5rem" radius="pill" />
        ))}
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 8 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
