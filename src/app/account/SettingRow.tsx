"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/icons";
import { DUR, DUR_FAST, EASE_IN_OUT } from "@/lib/motion/variants";
import styles from "./account.module.css";

/**
 * One line of a settings section: a label, the value as it stands, and an
 * Edit that opens the editor in place rather than navigating to a page for
 * a single field. Airbnb's Personal info and Google's account settings
 * both work this way, and both allow only one row open at a time — the
 * open row is the one thing on screen with unsaved work in it.
 *
 * The parent owns which row is open, so opening one closes another.
 */
export function SettingRow({
  label,
  value,
  placeholder = "Not set",
  editLabel = "Edit",
  open,
  onOpen,
  onCancel,
  onSave,
  saveLabel = "Save",
  canSave = true,
  children,
}: {
  label: string;
  value?: string | null;
  placeholder?: string;
  editLabel?: string;
  open: boolean;
  onOpen: () => void;
  onCancel: () => void;
  onSave: () => Promise<string | null>;
  saveLabel?: string;
  canSave?: boolean;
  children: React.ReactNode;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);

    const problem = await onSave();
    setSaving(false);
    if (problem) {
      setError(problem);
      return;
    }

    // A tick that fades rather than a toast: the change happened on this
    // row, so the confirmation belongs on it.
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  }

  return (
    <div className={styles.row} data-open={open || undefined}>
      <div className={styles.rowHead}>
        <div className={styles.rowText}>
          <p className={styles.rowLabel}>{label}</p>
          {!open && (
            <p className={styles.rowValue} data-empty={!value || undefined}>
              {value || placeholder}
            </p>
          )}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {justSaved ? (
            <motion.span
              key="saved"
              className={styles.saved}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR_FAST, ease: EASE_IN_OUT }}
            >
              <IconCheck aria-hidden />
              Saved
            </motion.span>
          ) : (
            <motion.button
              key="toggle"
              type="button"
              className={styles.edit}
              onClick={open ? onCancel : onOpen}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR_FAST, ease: EASE_IN_OUT }}
            >
              {open ? "Cancel" : editLabel}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="editor"
            className={styles.editor}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DUR, ease: EASE_IN_OUT }}
          >
            <div className={styles.editorInner}>
              {children}

              {error && (
                <p className={styles.rowError} role="alert">
                  {error}
                </p>
              )}

              <div className={styles.editorActions}>
                <Button type="button" size="sm" disabled={!canSave || saving} onClick={handleSave}>
                  {saving ? "Saving…" : saveLabel}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
