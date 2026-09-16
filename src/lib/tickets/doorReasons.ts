// Kept in sync with the check constraints on event_tickets.denied_reasons /
// reversed_reasons in supabase/schema.sql — those exist as defense-in-depth
// against a direct RPC call, not as the source of truth for this list.
export const DENIAL_REASONS = [
  "Ticket already used",
  "Name/ID doesn't match the ticket",
  "Wrong event or date",
  "Looks fake / duplicated",
  "Event at capacity",
  "Other",
] as const;

export const REVERSAL_REASONS = [
  "Denied by mistake — ticket was valid",
  "Issue resolved with guest",
  "Wrong ticket was checked",
  "Other",
] as const;
