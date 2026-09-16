import Link from "next/link";
import { IconArrowRight } from "@/components/icons";
import styles from "./SectionHeader.module.css";

/**
 * The only section header pattern: a title on the left, an optional
 * one-line description under it, and an optional "See all" link on the
 * right.
 */
export function SectionHeader({
  title,
  description,
  action,
  as: Heading = "h2",
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className={styles.header}>
      <div className={styles.text}>
        <Heading className={styles.title}>{title}</Heading>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className={styles.action}>
          {action.label}
          <IconArrowRight />
        </Link>
      )}
    </div>
  );
}
