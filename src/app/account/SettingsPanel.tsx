"use client";

import { useState } from "react";
import { DateOfBirthField } from "@/app/welcome/DateOfBirthField";
import { CountryField } from "@/app/welcome/CountryField";
import { countryName } from "@/app/welcome/countries";
import { SettingRow } from "./SettingRow";
import { DangerZone } from "./DangerZone";
import {
  changePassword,
  updateCountry,
  updateDateOfBirth,
  updateDisplayName,
} from "./actions";
import styles from "./account.module.css";

type OpenRow = "name" | "birthday" | "country" | "password" | null;

function formatDob(iso: string | null) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Sections in the order they are used, destructive actions last and set
 * apart — the arrangement every account screen converges on, and the one
 * that keeps a delete button away from a name change.
 */
export function SettingsPanel({
  displayName,
  dateOfBirth,
  country,
  email,
  usesPassword,
  provider,
}: {
  displayName: string | null;
  dateOfBirth: string | null;
  country: string | null;
  email: string;
  usesPassword: boolean;
  provider: string;
}) {
  const [open, setOpen] = useState<OpenRow>(null);

  const [name, setName] = useState(displayName ?? "");
  const [dob, setDob] = useState(() => {
    if (!dateOfBirth) return { day: "", month: "", year: "" };
    const [year, month, day] = dateOfBirth.split("-");
    return { day, month, year };
  });
  const [countryCode, setCountryCode] = useState(country ?? "");
  const [password, setPassword] = useState("");

  // The value shown on a closed row is the saved one, so a cancelled edit
  // leaves no trace.
  const [savedName, setSavedName] = useState(displayName ?? "");
  const [savedDob, setSavedDob] = useState(dateOfBirth);
  const [savedCountry, setSavedCountry] = useState(country ?? "");

  function close() {
    setOpen(null);
  }

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>You</h2>

        <SettingRow
          label="Name"
          value={savedName}
          placeholder="Not set"
          open={open === "name"}
          onOpen={() => {
            setName(savedName);
            setOpen("name");
          }}
          onCancel={close}
          canSave={name.trim().length > 0}
          onSave={async () => {
            const result = await updateDisplayName(name);
            if ("error" in result) return result.error;
            setSavedName(name.trim());
            close();
            return null;
          }}
        >
          <label className={styles.fieldLabel} htmlFor="setting-name">
            Your name
          </label>
          <input
            id="setting-name"
            className={styles.input}
            autoComplete="name"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className={styles.fieldHelp}>
            This is what staff see when you redeem a deal or a ticket.
          </p>
        </SettingRow>

        <SettingRow
          label="Date of birth"
          value={formatDob(savedDob)}
          open={open === "birthday"}
          onOpen={() => setOpen("birthday")}
          onCancel={close}
          canSave={dob.day !== "" && dob.month !== "" && dob.year.length === 4}
          onSave={async () => {
            const result = await updateDateOfBirth(dob);
            if ("error" in result) return result.error;
            setSavedDob(`${dob.year}-${dob.month.padStart(2, "0")}-${dob.day.padStart(2, "0")}`);
            close();
            return null;
          }}
        >
          <DateOfBirthField value={dob} onChange={setDob} />
        </SettingRow>

        <SettingRow
          label="Country"
          value={countryName(savedCountry)}
          open={open === "country"}
          onOpen={() => setOpen("country")}
          onCancel={close}
          canSave={countryCode !== ""}
          onSave={async () => {
            const result = await updateCountry(countryCode);
            if ("error" in result) return result.error;
            setSavedCountry(countryCode);
            close();
            return null;
          }}
        >
          <CountryField value={countryCode} onChange={setCountryCode} />
        </SettingRow>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Signing in</h2>

        <div className={styles.row}>
          <div className={styles.rowHead}>
            <div className={styles.rowText}>
              <p className={styles.rowLabel}>Email</p>
              <p className={styles.rowValue}>{email}</p>
            </div>
          </div>
        </div>

        {usesPassword ? (
          <SettingRow
            label="Password"
            value="••••••••"
            editLabel="Change"
            saveLabel="Update password"
            open={open === "password"}
            onOpen={() => {
              setPassword("");
              setOpen("password");
            }}
            onCancel={close}
            canSave={password.length >= 6}
            onSave={async () => {
              const result = await changePassword(password);
              if ("error" in result) return result.error;
              setPassword("");
              close();
              return null;
            }}
          >
            <label className={styles.fieldLabel} htmlFor="setting-password">
              New password
            </label>
            <input
              id="setting-password"
              type="password"
              className={styles.input}
              autoComplete="new-password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className={styles.fieldHelp}>At least 6 characters.</p>
          </SettingRow>
        ) : (
          <div className={styles.row}>
            <div className={styles.rowHead}>
              <div className={styles.rowText}>
                <p className={styles.rowLabel}>Password</p>
                <p className={styles.rowValue}>
                  You sign in with {provider === "google" ? "Google" : provider}, so there is no
                  password to change.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <DangerZone />
    </div>
  );
}
