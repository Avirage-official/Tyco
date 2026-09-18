"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { GoogleAuthButton } from "../GoogleAuthButton";
import { PasswordInput } from "../PasswordInput";
import { scopeOf, errorFor, type ErrorScope } from "../authErrors";
import { safeNext } from "../next";
import styles from "../auth.module.css";

export function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<ErrorScope>("form");
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const callbackUrl = new URL("/auth/callback", window.location.origin);
    const destination = safeNext(next);
    if (destination) callbackUrl.searchParams.set("next", destination);

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
      setScope(scopeOf(error.message));
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.push(destination ?? "/account");
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

      <form onSubmit={handleSubmit} noValidate>
        {error && scope === "form" && (
          <p className={styles.alert} role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}

        <div className={styles.fields}>
          <Input
            label="Name"
            type="text"
            autoComplete="name"
            helper="How you'll be greeted, and the name staff see when you redeem."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Input
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            error={errorFor(scope, error, "email")}
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordInput
            label="Password"
            autoComplete="new-password"
            minLength={6}
            helper="At least 6 characters."
            value={password}
            onChange={setPassword}
            error={errorFor(scope, error, "password")}
          />

          <Button type="submit" full className={styles.submit} disabled={loading}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </div>
      </form>
    </>
  );
}
