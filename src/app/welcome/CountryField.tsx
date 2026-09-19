"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconCheck } from "@/components/icons";
import { NEARBY, REST } from "./countries";
import styles from "./welcome.module.css";

/**
 * The markets Tyco serves as tappable rows, everything else behind a
 * disclosure. A 200-row select is the wrong control for a question nearly
 * everyone answers "Singapore" to, and it is the control that makes a form
 * look like a default one.
 */
export function CountryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  const chosenIsFar = value !== "" && !NEARBY.some((c) => c.code === value);
  const [showAll, setShowAll] = useState(chosenIsFar);

  return (
    <div className={styles.country}>
      <ul className={styles.countryList}>
        {NEARBY.map((country) => (
          <li key={country.code}>
            <button
              type="button"
              className={styles.countryRow}
              data-selected={value === country.code}
              aria-pressed={value === country.code}
              onClick={() => onChange(country.code)}
            >
              <span>{country.name}</span>
              {value === country.code && <IconCheck className={styles.countryTick} aria-hidden />}
            </button>
          </li>
        ))}
      </ul>

      {!showAll ? (
        <button type="button" className={styles.countryMore} onClick={() => setShowAll(true)}>
          Somewhere else
        </button>
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            key="rest"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className={styles.countrySelectWrap}
          >
            <label className={styles.dobLabel} htmlFor="country-all">
              Country
            </label>
            <select
              id="country-all"
              className={styles.countrySelect}
              value={chosenIsFar ? value : ""}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="" disabled>
                Choose a country
              </option>
              {REST.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
