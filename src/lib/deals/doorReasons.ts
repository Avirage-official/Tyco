// Kept in sync with the check constraints on deal_redemptions'
// declined_reasons / reversed_reasons in supabase/schema.sql — those exist as
// defense-in-depth against a direct RPC call, not as the source of truth for
// this list.
export const DECLINE_REASONS = [
  "Already redeemed",
  "Not valid at this outlet",
  "Outside the offer hours or dates",
  "Item or service unavailable",
  "Details do not match the member",
  "Other",
] as const;

export const REVERSAL_REASONS = [
  "Declined by mistake - the deal was valid",
  "Issue resolved with the member",
  "Wrong deal was checked",
  "Other",
] as const;
