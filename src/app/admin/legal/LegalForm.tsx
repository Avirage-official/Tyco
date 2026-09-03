"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateLegalTerms } from "./actions";
import styles from "../admin.module.css";

export function LegalForm({ initialValue }: { initialValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateLegalTerms(value);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        This is what shows on the public{" "}
        <a href="/terms" target="_blank" rel="noreferrer">
          /terms
        </a>{" "}
        page — shop, ticket, and deal policies, IP, liability, and so on. Start a line with{" "}
        <code>## </code> for a section heading. The shop checkout, the ticket purchase
        agreement, and the deal redeem agreement each link straight to a section — &ldquo;Shop
        purchases&rdquo;, &ldquo;Event tickets&rdquo;, and &ldquo;Deals&rdquo; — so keep those
        headings as <code>## Shop purchases {"{#shop}"}</code>,{" "}
        <code>## Event tickets {"{#tickets}"}</code>, and <code>## Deals {"{#deals}"}</code> — the{" "}
        <code>{"{#id}"}</code> part pins the link target even if you reword the heading.
      </p>

      <div className={styles.field}>
        <textarea
          className={styles.textarea}
          style={{ minHeight: "32rem", fontFamily: "monospace", fontSize: "0.85rem" }}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {saved && !error && <p className={styles.success}>Saved — live on /terms now.</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
