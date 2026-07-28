import styles from "./EmptyState.module.css";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={styles.state}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.desc}>{description}</p>
      {action}
    </div>
  );
}
