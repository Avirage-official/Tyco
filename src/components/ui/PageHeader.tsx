import styles from "./PageHeader.module.css";

/**
 * The page-level title block. An eyebrow is optional and should be rare —
 * the h1 carries the hierarchy on its own. `action` sits on the right
 * (a tab switcher, a primary button).
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`container ${wide ? "container--wide" : ""} ${styles.header}`}>
      <div className={styles.text}>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.desc}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </div>
  );
}
