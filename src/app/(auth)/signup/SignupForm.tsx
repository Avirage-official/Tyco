"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { GoogleAuthButton } from "../GoogleAuthButton";
import styles from "../auth.module.css";

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) callbackUrl.searchParams.set("next", next);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: callbackUrl.toString(),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      const destination = next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
      router.push(destination);
      router.refresh();
      return;
    }

    setNotice("Check your inbox to confirm your email, then sign in.");
    setLoading(false);
  }

  return (
    <>
      <GoogleAuthButton next={next} />
      <div className={styles.divider}>or</div>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="displayName">
            Name
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            className={styles.input}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}
        <Button type="submit" full disabled={loading}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </>
  );
}
