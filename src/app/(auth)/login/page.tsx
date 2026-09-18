import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { withNext } from "../next";
import styles from "../auth.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <>
      <h1 className={styles.title}>Welcome back</h1>
      <p className={styles.subtitle}>
        Sign in to pick up your deals, tickets and passes.
      </p>

      <LoginForm next={next} />

      <p className={styles.switch}>
        New here? <Link href={withNext("/signup", next)}>Create an account</Link>
      </p>
    </>
  );
}
