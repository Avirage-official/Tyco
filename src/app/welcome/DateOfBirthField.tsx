"use client";

import { useRef, type RefObject } from "react";
import styles from "./welcome.module.css";

type Part = "day" | "month" | "year";

/**
 * Three boxes rather than <input type="date">.
 *
 * A native date input renders differently in every browser — and on a phone
 * it throws up a system modal to pick a birthday decades back, which is a
 * lot of scrolling. Separate day/month/year boxes that advance as they fill
 * are what Stripe and Airbnb both use, they take a numeric keypad, and they
 * look like the rest of the site instead of like the operating system.
 */
export function DateOfBirthField({
  value,
  onChange,
  invalid,
}: {
  value: { day: string; month: string; year: string };
  onChange: (next: { day: string; month: string; year: string }) => void;
  invalid?: boolean;
}) {
  const dayRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  function set(part: Part, raw: string, maxLength: number, next?: RefObject<HTMLInputElement | null>) {
    const digits = raw.replace(/\D/g, "").slice(0, maxLength);
    onChange({ ...value, [part]: digits });
    // Only jump forward once the box is genuinely full, and never while
    // someone is deleting — otherwise backspacing out of a typo is a fight.
    if (digits.length === maxLength && raw.length >= value[part].length) {
      next?.current?.focus();
    }
  }

  return (
    <fieldset className={styles.dob} data-invalid={invalid || undefined}>
      <legend className="visually-hidden">Date of birth</legend>

      <label className={styles.dobPart}>
        <span className={styles.dobLabel}>Day</span>
        <input
          ref={dayRef}
          className={styles.dobInput}
          inputMode="numeric"
          autoComplete="bday-day"
          placeholder="DD"
          maxLength={2}
          value={value.day}
          onChange={(e) => set("day", e.target.value, 2, monthRef)}
        />
      </label>

      <label className={styles.dobPart}>
        <span className={styles.dobLabel}>Month</span>
        <input
          ref={monthRef}
          className={styles.dobInput}
          inputMode="numeric"
          autoComplete="bday-month"
          placeholder="MM"
          maxLength={2}
          value={value.month}
          onChange={(e) => set("month", e.target.value, 2, yearRef)}
          onKeyDown={(e) => {
            // Backspace in an empty box steps back, so the three boxes
            // erase like the single field they stand in for.
            if (e.key === "Backspace" && value.month === "") {
              dayRef.current?.focus();
              e.preventDefault();
            }
          }}
        />
      </label>

      <label className={`${styles.dobPart} ${styles.dobYear}`}>
        <span className={styles.dobLabel}>Year</span>
        <input
          ref={yearRef}
          className={styles.dobInput}
          inputMode="numeric"
          autoComplete="bday-year"
          placeholder="YYYY"
          maxLength={4}
          value={value.year}
          onChange={(e) => set("year", e.target.value, 4)}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && value.year === "") {
              monthRef.current?.focus();
              e.preventDefault();
            }
          }}
        />
      </label>
    </fieldset>
  );
}
