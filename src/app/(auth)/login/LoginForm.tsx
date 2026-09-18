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

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<ErrorScope>("form");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setScope(scopeOf(error.message));
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(safeNext(next) ?? "/account");
    router.refresh();
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

        <div className={styles.fields}>
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
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
            error={errorFor(scope, error, "password")}
          />

          <Button type="submit" full className={styles.submit} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </>
  );
}
