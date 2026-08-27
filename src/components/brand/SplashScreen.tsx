"use client";

import { useEffect, useState } from "react";
import styles from "./SplashScreen.module.css";

const FLAG = "tyco-splash-seen";
const HOLD_MS = 1900;
const FADE_MS = 650;

export function SplashScreen() {
  const [phase, setPhase] = useState<"hidden" | "visible" | "leaving">("hidden");

  useEffect(() => {
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, "1");
    // One-time client bootstrap gated on a browser-only API (sessionStorage) —
    // there's no server snapshot to render instead, so this can't move to the
    // initial state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPhase("visible");

    const leaveTimer = setTimeout(() => setPhase("leaving"), HOLD_MS);
    const removeTimer = setTimeout(() => setPhase("hidden"), HOLD_MS + FADE_MS);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === "hidden") return null;

  return (
    <div
      className={`${styles.overlay} ${phase === "leaving" ? styles.leaving : ""}`}
      aria-hidden={phase === "leaving"}
    >
      <div className={styles.stage}>
        <p className={styles.eyebrow}>Creative collective</p>
        <h1 className={styles.mark}>
          <span className={styles.markClip}>
            <span className={styles.markInner}>
              Tyc<em>o</em>
            </span>
          </span>
        </h1>
        <span className={styles.rule} aria-hidden />
      </div>
    </div>
  );
}
