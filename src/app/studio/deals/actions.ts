"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRevolutOrder } from "@/lib/checkout/revolut";

/**
 * Starts a deal redemption. Requires a signed-in member — same reasoning as
 * ticket checkout: a redemption only means something tied to an account
 * (that's how the reference code maps back to a person at the vendor
 * counter).
 */
export async function startDealCheckout(dealId: string, agreedToNoRefundPolicy: boolean) {
  if (!agreedToNoRefundPolicy) {
    throw new Error("You must agree that this redemption is final before continuing.");
  }

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) {
    throw new Error("Sign in to redeem deals.");
  }

  const supabase = createAdminClient();

  const { data: deal, error: dealError } = await supabase
    .from("deals")
    .select("id, vendor_id, currency, vendor_rate_cents, margin_percent, is_published")
    .eq("id", dealId)
    .single();
  if (dealError || !deal || !deal.is_published) {
    throw new Error("This deal is no longer available.");
  }

  const { data: cycle, error: cycleError } = await supabase.rpc("get_or_create_deal_cycle", {
    p_deal_id: deal.id,
  });
  if (cycleError || !cycle) {
    throw new Error("Could not start checkout.");
  }

  if (cycle.redemptions_used >= cycle.redemptions_cap) {
    throw new Error("This deal is fully claimed for the month — check back next month.");
  }

  const { data: settings } = await supabase
    .from("site_settings")
    .select("deal_gateway_fee_percent")
    .eq("id", true)
    .maybeSingle();
  const gatewayFeePercent = settings?.deal_gateway_fee_percent ?? 3;

  const memberPriceCents = Math.round(deal.vendor_rate_cents * (1 + deal.margin_percent / 100));
  const totalCents = Math.round(memberPriceCents * (1 + gatewayFeePercent / 100));
  const gatewayFeeCents = totalCents - memberPriceCents;
  const tycoMarginCents = memberPriceCents - deal.vendor_rate_cents;

  const { data: redemption, error: redemptionError } = await supabase
    .from("deal_redemptions")
    .insert({
      deal_id: deal.id,
      deal_cycle_id: cycle.id,
      vendor_id: deal.vendor_id,
      user_id: user.id,
      vendor_rate_cents: deal.vendor_rate_cents,
      margin_percent: deal.margin_percent,
      member_price_cents: memberPriceCents,
      gateway_fee_percent: gatewayFeePercent,
      gateway_fee_cents: gatewayFeeCents,
      total_cents: totalCents,
      tyco_margin_cents: tycoMarginCents,
      currency: deal.currency,
      status: "pending",
    })
    .select("id")
    .single();
  if (redemptionError || !redemption) {
    throw new Error(redemptionError?.message ?? "Could not start checkout.");
  }

  // Free deals never touch Revolut — nothing to pay for.
  if (totalCents === 0) {
    await supabase.from("deal_redemptions").update({ status: "paid" }).eq("id", redemption.id);
    await supabase.rpc("increment_deal_cycle_redemptions", { p_cycle_id: cycle.id, p_quantity: 1 });
    return { checkoutUrl: `/account/deals?redemption=${redemption.id}` };
  }

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`;

  const { checkoutUrl, revolutOrderId } = await createRevolutOrder({
    amountCents: totalCents,
    currency: deal.currency,
    orderId: `deal:${redemption.id}`,
    redirectUrl: `${origin}/account/deals?redemption=${redemption.id}`,
  });

  if (revolutOrderId) {
    await supabase.from("deal_redemptions").update({ revolut_order_id: revolutOrderId }).eq("id", redemption.id);
  }

  return { checkoutUrl };
}
