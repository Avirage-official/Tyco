"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  createVendor,
  updateVendor,
  type VendorInput,
  type VendorNotesInput,
} from "./actions";
import styles from "../admin.module.css";

type Vendor = { id: string; name: string; is_active: boolean };
type VendorNotes = VendorNotesInput;

export function VendorForm({ vendor, notes }: { vendor?: Vendor; notes?: VendorNotes }) {
  const router = useRouter();
  const [name, setName] = useState(vendor?.name ?? "");
  const [isActive, setIsActive] = useState(vendor?.is_active ?? true);
  const [contactName, setContactName] = useState(notes?.contact_name ?? "");
  const [contactEmail, setContactEmail] = useState(notes?.contact_email ?? "");
  const [contactPhone, setContactPhone] = useState(notes?.contact_phone ?? "");
  const [internalNotes, setInternalNotes] = useState(notes?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const input: VendorInput = { name, is_active: isActive };
      const notesInput: VendorNotesInput = {
        contact_name: contactName || null,
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        notes: internalNotes || null,
      };

      if (vendor) {
        await updateVendor(vendor.id, input, notesInput);
      } else {
        await createVendor(input, notesInput);
      }

      router.push("/admin/vendors");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="name">
          Vendor name
        </label>
        <input
          id="name"
          className={styles.input}
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p className={styles.hint}>Shown publicly on any deal attached to this vendor.</p>
      </div>

      <div className={styles.checkboxRow}>
        <input
          id="is_active"
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label htmlFor="is_active">Active</label>
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact_name">
            Contact name
          </label>
          <input
            id="contact_name"
            className={styles.input}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact_phone">
            Contact phone
          </label>
          <input
            id="contact_phone"
            className={styles.input}
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="contact_email">
          Contact email
        </label>
        <input
          id="contact_email"
          type="email"
          className={styles.input}
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="notes">
          Internal notes
        </label>
        <p className={styles.hint}>Admin-only — never shown to members. Deal terms, negotiation history, etc.</p>
        <textarea
          id="notes"
          className={styles.textarea}
          value={internalNotes}
          onChange={(e) => setInternalNotes(e.target.value)}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : vendor ? "Save changes" : "Create vendor"}
        </Button>
      </div>
    </form>
  );
}
