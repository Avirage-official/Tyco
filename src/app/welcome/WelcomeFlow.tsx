"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { IconArrowRight } from "@/components/icons";
import { DUR, EASE_IN_OUT } from "@/lib/motion/variants";
import { completeOnboarding } from "./actions";
import { validateName, validateDateOfBirth, validateCountry } from "./validate";
import { DateOfBirthField } from "./DateOfBirthField";
import { CountryField } from "./CountryField";
import styles from "./welcome.module.css";

const STEPS = ["name", "birthday", "country"] as const;
type Step = (typeof STEPS)[number];

/** How long the finished state holds before the member is moved on. */
const PAYOFF_MS = 1400;

/**
 * The column travels, the photograph does not. Each step leaves in the
 * direction of travel and the next arrives from the opposite side, so going
 * back reads as going back rather than as another forward step.
 */
const panel = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  center: { opacity: 1, x: 0, transition: { duration: DUR + 0.04, ease: EASE_IN_OUT } },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -24,
    transition: { duration: DUR, ease: EASE_IN_OUT },
  }),
};

/** Inside a step: question, then field, then helper. */
const stack = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

const line = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE_IN_OUT } },
};

export function WelcomeFlow({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(initialName);
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const [country, setCountry] = useState("");

  const step: Step = STEPS[index];

  const ready =
    step === "name"
      ? displayName.trim().length > 0
      : step === "birthday"
        ? dob.day.length > 0 && dob.month.length > 0 && dob.year.length === 4
        : country !== "";

  function go(next: number) {
    setError(null);
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  /** The current answer's own rule, so a bad one is caught on its own screen. */
  function errorForStep(): string | null {
    if (step === "name") return validateName(displayName);
    if (step === "birthday") {
      const checked = validateDateOfBirth(dob);
      return "error" in checked ? checked.error : null;
    }
    return validateCountry(country);
  }

  async function handleContinue() {
    if (!ready || saving) return;

    const stepError = errorForStep();
    if (stepError) {
      setError(stepError);
      return;
    }

    if (index < STEPS.length - 1) {
      go(index + 1);
      return;
    }

    setSaving(true);
    setError(null);
    const result = await completeOnboarding({ displayName, ...dob, country });

    if ("error" in result && result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    // The payoff: the questions clear and the name lands on its own before
    // the member is handed to their account.
    setDone(true);
    setTimeout(() => {
      router.push("/account");
      router.refresh();
    }, PAYOFF_MS);
  }

  if (done) {
    return (
      <motion.div
        className={styles.payoff}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { duration: DUR, ease: EASE_IN_OUT } }}
      >
        <motion.p
          className={styles.payoffLine}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.44, ease: EASE_IN_OUT } }}
        >
          Welcome, {displayName.trim()}.
        </motion.p>
        <motion.p
          className={styles.payoffSub}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: DUR, delay: 0.24, ease: EASE_IN_OUT } }}
        >
          Taking you to your account…
        </motion.p>
      </motion.div>
    );
  }

  return (
    <form
      className={styles.flow}
      onSubmit={(e) => {
        e.preventDefault();
        void handleContinue();
      }}
    >
      <div className={styles.stage}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={step}
            className={styles.step}
            custom={direction}
            variants={panel}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <motion.div variants={stack} initial="hidden" animate="visible">
              {step === "name" && (
                <>
                  <motion.h1 className={styles.question} variants={line}>
                    What should we call you?
                  </motion.h1>
                  <motion.div variants={line}>
                    <input
                      className={styles.textInput}
                      autoFocus
                      autoComplete="name"
                      maxLength={60}
                      placeholder="Your name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      aria-label="Your name"
                    />
                  </motion.div>
                  <motion.p className={styles.helper} variants={line}>
                    This is the name staff see when you redeem a deal or a ticket.
                  </motion.p>
                </>
              )}

              {step === "birthday" && (
                <>
                  <motion.h1 className={styles.question} variants={line}>
                    When were you born?
                  </motion.h1>
                  <motion.div variants={line}>
                    <DateOfBirthField value={dob} onChange={setDob} invalid={Boolean(error)} />
                  </motion.div>
                  <motion.p className={styles.helper} variants={line}>
                    Some events and venues have a minimum age. We keep this on your
                    account and never show it to anyone else.
                  </motion.p>
                </>
              )}

              {step === "country" && (
                <>
                  <motion.h1 className={styles.question} variants={line}>
                    Where are you based?
                  </motion.h1>
                  <motion.div variants={line}>
                    <CountryField value={country} onChange={setCountry} />
                  </motion.div>
                </>
              )}

              {error && (
                <motion.p className={styles.error} role="alert" variants={line}>
                  {error}
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className={styles.footer}>
        <div className={styles.track} aria-hidden>
          <motion.span
            className={styles.trackFill}
            initial={false}
            animate={{ width: `${((index + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 240, damping: 30 }}
          />
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.back}
            onClick={() => go(index - 1)}
            disabled={index === 0 || saving}
          >
            Back
          </button>

          <Button type="submit" disabled={!ready || saving} className={styles.continue}>
            {saving ? "Saving…" : index === STEPS.length - 1 ? "Finish" : "Continue"}
            <IconArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    </form>
  );
}
