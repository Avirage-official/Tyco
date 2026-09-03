const MONTH_RE = /^\d{4}-\d{2}$/;

export function currentMonthStr() {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Validates a `?month=` query param, falling back to the current month. */
export function resolveMonth(monthParam: string | null | undefined) {
  return monthParam && MONTH_RE.test(monthParam) ? monthParam : currentMonthStr();
}

/** [start, end) ISO timestamp bounds for a "YYYY-MM" month string, in UTC. */
export function monthBounds(monthStr: string) {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start: start.toISOString(), end: end.toISOString() };
}
