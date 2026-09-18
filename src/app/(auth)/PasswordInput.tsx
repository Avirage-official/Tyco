"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Field";
import { IconEye, IconEyeOff } from "@/components/icons";
import styles from "./auth.module.css";

/**
 * A password box with a reveal. Typing a password blind on a phone is the
 * single largest source of failed sign-ins, which is why every provider
 * ships this control; the state is per-field and never persisted.
 */
export function PasswordInput({
  label,
  autoComplete,
  value,
  onChange,
  error,
  minLength,
  helper,
}: {
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  minLength?: number;
  helper?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <Input
      label={label}
      type={revealed ? "text" : "password"}
      required
      minLength={minLength}
      helper={helper}
      error={error}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      trailing={
        <button
          type="button"
          className={styles.reveal}
          onClick={() => setRevealed((r) => !r)}
          aria-pressed={revealed}
          aria-label={revealed ? "Hide password" : "Show password"}
        >
          {revealed ? <IconEyeOff aria-hidden /> : <IconEye aria-hidden />}
        </button>
      }
    />
  );
}
