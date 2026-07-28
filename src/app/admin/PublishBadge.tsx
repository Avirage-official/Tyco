import styles from "./admin.module.css";

export function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span className={`${styles.badge} ${isPublished ? styles.badgePublished : styles.badgeDraft}`}>
      {isPublished ? "Published" : "Draft"}
    </span>
  );
}
