/**
 * Supabase hands back one flat message for every failure. Some of those
 * are about a single box ("Password should be at least 6 characters") and
 * belong next to it; the rest are about the attempt as a whole ("Invalid
 * login credentials" — which of the two was wrong is deliberately not
 * disclosed) and belong above the form.
 *
 * Matching on text is not pretty, but the API offers nothing better, and
 * the fallback is the safe one: anything unrecognised is shown as a
 * form-level message rather than blamed on the wrong field.
 */
export type ErrorScope = "email" | "password" | "form";

export function scopeOf(message: string): ErrorScope {
  const m = message.toLowerCase();
  if (m.includes("password") && !m.includes("credentials")) return "password";
  if (m.includes("already registered") || m.includes("already been registered")) return "email";
  if (m.includes("email") && !m.includes("not confirmed")) return "email";
  return "form";
}

/** The message to show on a given field, or null when it belongs elsewhere. */
export function errorFor(scope: ErrorScope, error: string | null, field: ErrorScope) {
  return error && scope === field ? error : null;
}
