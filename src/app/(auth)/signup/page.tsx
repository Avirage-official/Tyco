import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";
import { withNext } from "../next";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Create account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className={styles.title}>Join Tyco</h1>
      <p className={styles.subtitle}>
        Member deals at the places you already go, and first access to every
        happening.
      </p>

      <SignupForm next={next} />

      <p className={styles.legal}>
        By creating an account you agree to the{" "}
        <Link href="/terms">terms of use</Link>.
      </p>

      <p className={styles.switch}>
        Already have an account? <Link href={withNext("/login", next)}>Sign in</Link>
      </p>
    </>
  );
}
