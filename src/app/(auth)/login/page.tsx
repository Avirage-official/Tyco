import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to your Tyco account.</p>
        <LoginForm next={next} />
        <p className={styles.switch}>
          New here? <Link href="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
