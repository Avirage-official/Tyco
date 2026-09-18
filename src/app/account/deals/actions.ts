"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DealRedemption } from "@/lib/supabase/types";
import { DECLINE_REASONS, REVERSAL_REASONS } from "@/lib/deals/doorReasons";

function validateReasons(reasons: string[], allowed: readonly string[]) {
  if (reasons.length === 0) throw new Error("Choose at least one reason.");
  if (!reasons.every((reason) => allowed.includes(reason))) {
    throw new Error("Choose a reason from the list.");
  }
}

/**
 * The counter flow, mirroring the event door in
 * src/app/account/tickets/actions.ts: vendor staff have no Tyco account, so
 * the member shows their own already-signed-in deal and staff type their name
 * and tap a decision. Ownership is re-checked inside each RPC
 * (user_id = auth.uid()) rather than assumed from this page being reachable
 * only by the redemption's owner.
 *
 * A decline never moves money. It records what happened and hands the month's
 * slot back; whether the member is refunded is settled by Tyco afterwards.
 */
export async function approveDealCheckIn(redemptionId: string, staffName: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("approve_deal_checkin", {
    p_redemption_id: redemptionId,
    p_staff_name: staffName,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/deals");
  return data as DealRedemption;
}

export async function declineDealCheckIn(redemptionId: string, staffName: string, reasons: string[]) {
  validateReasons(reasons, DECLINE_REASONS);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("decline_deal_checkin", {
    p_redemption_id: redemptionId,
    p_staff_name: staffName,
    p_reasons: reasons,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/deals");
  return data as DealRedemption;
}

export async function reverseDealDecline(redemptionId: string, staffName: string, reasons: string[]) {
  validateReasons(reasons, REVERSAL_REASONS);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reverse_deal_decline", {
    p_redemption_id: redemptionId,
    p_staff_name: staffName,
    p_reasons: reasons,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/account/deals");
  return data as DealRedemption;
}
