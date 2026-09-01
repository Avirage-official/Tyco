"use server";

import { requireAdmin } from "@/lib/admin/require-admin";

export type DealRedemptionLookup = {
  id: string;
  status: string;
  total_cents: number;
  currency: string;
  approved_at: string | null;
  dealTitle: string;
  vendorName: string;
};

async function withDealAndVendor(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  redemption: {
    id: string;
    status: string;
    total_cents: number;
    currency: string;
    approved_at: string | null;
    deal_id: string;
    vendor_id: string;
  }
): Promise<DealRedemptionLookup> {
  const [{ data: deal }, { data: vendor }] = await Promise.all([
    supabase.from("deals").select("title").eq("id", redemption.deal_id).maybeSingle(),
    supabase.from("vendors").select("name").eq("id", redemption.vendor_id).maybeSingle(),
  ]);

  return {
    id: redemption.id,
    status: redemption.status,
    total_cents: redemption.total_cents,
    currency: redemption.currency,
    approved_at: redemption.approved_at,
    dealTitle: deal?.title ?? "Deal",
    vendorName: vendor?.name ?? "Vendor",
  };
}

export async function lookupDealRedemption(code: string): Promise<DealRedemptionLookup | null> {
  const { supabase } = await requireAdmin();
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;

  const { data: redemption } = await supabase
    .from("deal_redemptions")
    .select("id, status, total_cents, currency, approved_at, deal_id, vendor_id")
    .eq("reference_code", normalized)
    .maybeSingle();

  if (!redemption) return null;

  return withDealAndVendor(supabase, redemption);
}

export async function approveDealRedemption(redemptionId: string): Promise<DealRedemptionLookup> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.rpc("approve_deal_redemption", {
    p_redemption_id: redemptionId,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not approve this redemption.");

  return withDealAndVendor(supabase, data);
}
