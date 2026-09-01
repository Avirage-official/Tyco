import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice } from "@/lib/format";
import styles from "./deals.module.css";

export const metadata: Metadata = { title: "Your deals" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

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

  const { data: redemptions } = await supabase
    .from("deal_redemptions")
    .select("id, total_cents, currency, status, reference_code, approved_at, created_at, deal_id, vendor_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const dealIds = Array.from(new Set((redemptions ?? []).map((r) => r.deal_id)));
  type DealRow = { id: string; title: string };
  let deals: DealRow[] = [];
  if (dealIds.length > 0) {
    const { data } = await supabase.from("deals").select("id, title").in("id", dealIds);
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
            action={<LinkButton href="/studio/deals">See deals</LinkButton>}
          />
        ) : (
          <ul className={styles.list}>
            {redemptions.map((redemption) => {
              const justPurchased = redemption.id === justPurchasedId;
              return (
                <li
                  key={redemption.id}
                  className={justPurchased ? `${styles.card} ${styles.cardHighlight}` : styles.card}
                >
                  <div className={styles.cardHeader}>
                    <div>
                      <p className={styles.dealTitle}>{dealById.get(redemption.deal_id)?.title ?? "Deal"}</p>
                      <p className={styles.dealMeta}>{vendorById.get(redemption.vendor_id) ?? "Vendor"}</p>
                    </div>
                    <span className={`${styles.status} ${styles[`status_${redemption.status}`] ?? ""}`}>
                      {STATUS_LABEL[redemption.status] ?? redemption.status}
                    </span>
                  </div>

                  {redemption.status === "paid" && (
                    <div className={styles.proof}>
                      <div>
                        <p className={styles.proofLabel}>Show this at the counter</p>
                        <p className={styles.referenceCode}>{redemption.reference_code}</p>
                      </div>
                    </div>
                  )}

                  {justPurchased && redemption.status === "pending" && (
                    <p className={styles.confirming}>
                      We&rsquo;re confirming your payment — refresh this page in a moment if it doesn&rsquo;t
                      update.
                    </p>
                  )}

                  {redemption.approved_at && (
                    <p className={styles.approved}>Redeemed {formatDate(redemption.approved_at)}</p>
                  )}

                  <div className={styles.cardFooter}>
                    <span>Total</span>
                    <span className={styles.total}>{formatPrice(redemption.total_cents, redemption.currency)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
