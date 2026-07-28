import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./SignupForm";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Join Tyco</h1>
        <p className={styles.subtitle}>Create an account to check out and follow along.</p>
        <SignupForm />
        <p className={styles.switch}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
