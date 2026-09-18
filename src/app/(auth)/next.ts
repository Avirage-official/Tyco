/**
 * `?next=` decides where someone lands after signing in, so it is never
 * trusted as given: only a same-origin path is honoured. `//evil.com` is a
 * protocol-relative URL, which is why a leading slash alone is not enough.
 */
export function safeNext(next?: string): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

/** Carries a pending destination across the sign-in / sign-up switch. */
export function withNext(path: string, next?: string): string {
  const safe = safeNext(next);
  return safe ? `${path}?next=${encodeURIComponent(safe)}` : path;
}
