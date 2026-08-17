"use client";

import { useState } from "react";
import { IconPlus } from "@/components/icons";
import styles from "./Accordion.module.css";

export function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {title}
        <IconPlus className={open ? `${styles.icon} ${styles.iconOpen}` : styles.icon} />
      </button>
      {open && <div className={styles.panel}>{children}</div>}
    </div>
  );
}
