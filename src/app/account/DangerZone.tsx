"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { signOut } from "@/lib/auth/signOut";
import { clearStoredCart } from "@/lib/cart/CartContext";
import { deleteOwnAccount } from "./actions";
import styles from "./account.module.css";

/**
 * Last on the page and set apart, the placement every settings screen uses
 * to keep an irreversible action away from an everyday one. Deleting asks
 * for the word rather than a single tap: a confirm dialog that can be
 * dismissed by reflex is not a confirmation.
 */
export function DangerZone() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.push("/");
    router.refresh();
  }

  async function handleDelete() {
    setBusy(true);
    setError(null);

    const result = await deleteOwnAccount(confirmation);
    if ("error" in result) {
      setError(result.error);
      setBusy(false);
      return;
    }

    // The account is gone; the browser is still holding its session, so
    // clear it before leaving rather than landing on a page that tries to
    // read a user that no longer exists.
    await signOut();
    clearStoredCart();
    router.push("/");
    router.refresh();
  }

  return (
    <section className={`${styles.section} ${styles.leaving}`}>
      <h2 className={styles.sectionTitle}>Leaving</h2>

      <div className={styles.row}>
        <div className={styles.rowHead}>
          <div className={styles.rowText}>
            <p className={styles.rowLabel}>Sign out</p>
            <p className={styles.rowValue}>You can sign back in any time.</p>
          </div>
          <button type="button" className={styles.edit} onClick={handleSignOut} disabled={busy}>
            Sign out
          </button>
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.rowHead}>
          <div className={styles.rowText}>
            <p className={styles.rowLabel}>Delete account</p>
            <p className={styles.rowValue}>
              Your tickets, deals and orders go with it. This cannot be undone.
            </p>
          </div>
          <button
            type="button"
            className={`${styles.edit} ${styles.destructive}`}
            onClick={() => {
              setConfirmation("");
              setError(null);
              setConfirming(true);
            }}
          >
            Delete
          </button>
        </div>
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} labelledBy="delete-account-title">
        <div className={styles.confirm}>
          <h2 id="delete-account-title" className={styles.confirmTitle}>
            Delete your account?
          </h2>
          <p className={styles.confirmBody}>
            Every ticket, deal and order on this account is deleted with it, including anything
            you have paid for and not yet used. We cannot bring it back.
          </p>

          <label className={styles.fieldLabel} htmlFor="delete-confirm">
            Type <strong>delete</strong> to confirm
          </label>
          <input
            id="delete-confirm"
            className={styles.input}
            autoComplete="off"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
          />

          {error && (
            <p className={styles.rowError} role="alert">
              {error}
            </p>
          )}

          <div className={styles.confirmActions}>
            <Button type="button" variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>
              Keep my account
            </Button>
            <Button
              type="button"
              className={styles.confirmDelete}
              disabled={busy || confirmation.trim().toLowerCase() !== "delete"}
              onClick={handleDelete}
            >
              {busy ? "Deleting…" : "Delete account"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
