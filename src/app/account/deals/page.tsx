import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { DealList } from "./DealList";

export const metadata: Metadata = { title: "Your deals" };

export default async function AccountDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ redemption?: string }>;
}) {
  const { redemption: justPurchasedId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/deals");
  }

  // A redemption stuck at "pending" (an abandoned checkout) that's more
  // than 12 hours old is never coming back — sweep it to "cancelled" so it
  // doesn't sit forever with a stale "confirming your payment" message.
  await supabase.rpc("expire_stale_deal_redemptions");

  // Staff check the name on the pass against the person holding the phone.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const holderName = profile?.display_name ?? "Member";

  const { data: redemptions } = await supabase
    .from("deal_redemptions")
    .select(
      "id, total_cents, currency, status, reference_code, approved_at, approved_by_name, declined_at, declined_by_name, declined_reasons, reversed_at, reversed_by_name, reversed_reasons, created_at, deal_id, vendor_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const dealIds = Array.from(new Set((redemptions ?? []).map((r) => r.deal_id)));
  type DealRow = { id: string; title: string; cover_url: string | null };
  let deals: DealRow[] = [];
  if (dealIds.length > 0) {
    const { data } = await supabase.from("deals").select("id, title, cover_url").in("id", dealIds);
    deals = data ?? [];
  }
  const dealById = new Map(deals.map((d) => [d.id, d]));

  const vendorIds = Array.from(new Set((redemptions ?? []).map((r) => r.vendor_id)));
  type VendorRow = { id: string; name: string };
  let vendors: VendorRow[] = [];
  if (vendorIds.length > 0) {
    const { data } = await supabase.from("vendors").select("id, name").in("id", vendorIds);
    vendors = data ?? [];
  }
  const vendorById = new Map(vendors.map((v) => [v.id, v.name]));

  return (
    <>
      <PageHeader eyebrow="Your account" title="Your deals" />
      <div className="container">
        {!redemptions || redemptions.length === 0 ? (
          <EmptyState
            title="No deals redeemed yet"
            description="Deals you redeem from the Membership network show up here — this is what you show at the vendor counter."
            action={<LinkButton href="/deals">See deals</LinkButton>}
          />
        ) : (
          <DealList
            redemptions={redemptions}
            dealById={dealById}
            vendorById={vendorById}
            holderName={holderName}
            justPurchasedId={justPurchasedId}
          />
        )}
      </div>
    </>
  );
}
