import styles from "./EmptyState.module.css";

/**
 * What a list or grid shows when there is nothing in it: an optional
 * icon, a one-line title, a one-line description, and at most one action.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.state}>
      {icon && (
        <span className={styles.icon} aria-hidden>
          {icon}
        </span>
      )}
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
