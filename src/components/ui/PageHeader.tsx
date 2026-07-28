import styles from "./PageHeader.module.css";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className={`container ${styles.header}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.desc}>{description}</p>}
    </div>
  );
}
