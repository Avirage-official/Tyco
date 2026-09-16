import styles from "./Badge.module.css";

export type BadgeTone = "neutral" | "success" | "warning";

/**
 * A small status label. `success` (teal) is for availability, paid and
 * checked-in states and new items; `warning` (red) is for pending payment
 * and errors; `neutral` for everything else.
 */
export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={[styles.badge, styles[tone], className ?? ""].filter(Boolean).join(" ")}>{children}</span>
  );
}
