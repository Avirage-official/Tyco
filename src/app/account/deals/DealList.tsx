"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/Badge";
import { Pass, PassCode } from "@/components/account/Pass";
import { HandoverPanel } from "@/components/account/HandoverPanel";
import { fadeUpContainer, fadeUpItem, revealViewport } from "@/lib/motion/variants";
import { formatPrice } from "@/lib/format";
import { DECLINE_REASONS, REVERSAL_REASONS } from "@/lib/deals/doorReasons";
import { approveDealCheckIn, declineDealCheckIn, reverseDealDecline } from "./actions";
import styles from "./deals.module.css";

type Redemption = {
  id: string;
  total_cents: number;
  currency: string;
  status: string;
  reference_code: string;
  approved_at: string | null;
  approved_by_name: string | null;
  declined_at: string | null;
  declined_by_name: string | null;
  declined_reasons: string[] | null;
  reversed_at: string | null;
  reversed_by_name: string | null;
  reversed_reasons: string[] | null;
  deal_id: string;
  vendor_id: string;
};

type DealRow = { id: string; title: string; cover_url: string | null };

export function DealList({
  redemptions,
  dealById,
  vendorById,
  holderName,
  justPurchasedId,
}: {
  redemptions: Redemption[];
  dealById: Map<string, DealRow>;
  vendorById: Map<string, string>;
  holderName: string;
  justPurchasedId?: string;
}) {
  return (
    <motion.ul
      className={styles.list}
      variants={fadeUpContainer}
      initial="hidden"
      whileInView="visible"
      viewport={revealViewport}
    >
      {redemptions.map((redemption) => {
        const deal = dealById.get(redemption.deal_id);
        const title = deal?.title ?? "Deal";
        const vendor = vendorById.get(redemption.vendor_id) ?? "Vendor";

        return (
          <motion.li key={redemption.id} variants={fadeUpItem}>
            <Pass
              coverUrl={deal?.cover_url ?? null}
              coverAlt={`${title} at ${vendor}`}
              title={title}
              meta={vendor}
              holderName={holderName}
              highlight={redemption.id === justPurchasedId}
              status={
                redemption.status !== "paid" ? (
                  <span className={styles.statusSlot}>
                    <Badge tone={redemption.status === "pending" ? "warning" : "neutral"}>
                      {redemption.status === "pending" ? "Payment pending" : redemption.status}
                    </Badge>
                  </span>
                ) : null
              }
              footer={
                <>
                  <PassCode code={redemption.reference_code} />
                  <span>{formatPrice(redemption.total_cents, redemption.currency)}</span>
                </>
              }
            >
              {redemption.status === "paid" && (
                <HandoverPanel
                  noun="deal"
                  actionLabel="Redeem"
                  approvedLabel="Redeemed"
                  declineReasons={DECLINE_REASONS}
                  reversalReasons={REVERSAL_REASONS}
                  declineNote="We'll check this with the vendor and come back to you about a refund."
                  decision={{
                    approvedAt: redemption.approved_at,
                    approvedByName: redemption.approved_by_name,
                    declinedAt: redemption.declined_at,
                    declinedByName: redemption.declined_by_name,
                    declinedReasons: redemption.declined_reasons,
                    reversedAt: redemption.reversed_at,
                    reversedByName: redemption.reversed_by_name,
                    reversedReasons: redemption.reversed_reasons,
                  }}
                  onApprove={async (staffName) => toDecision(await approveDealCheckIn(redemption.id, staffName))}
                  onDecline={async (staffName, reasons) =>
                    toDecision(await declineDealCheckIn(redemption.id, staffName, reasons))
                  }
                  onReverse={async (staffName, reasons) =>
                    toDecision(await reverseDealDecline(redemption.id, staffName, reasons))
                  }
                />
              )}

              {redemption.status === "pending" && redemption.id === justPurchasedId && (
                <p className={styles.confirming}>
                  We&rsquo;re confirming your payment — refresh this page in a moment if it
                  doesn&rsquo;t update.
                </p>
              )}
            </Pass>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}

type RedemptionDecisionFields = {
  approved_at: string | null;
  approved_by_name: string | null;
  declined_at: string | null;
  declined_by_name: string | null;
  declined_reasons: string[] | null;
  reversed_at: string | null;
  reversed_by_name: string | null;
  reversed_reasons: string[] | null;
};

function toDecision(r: RedemptionDecisionFields) {
  return {
    approvedAt: r.approved_at,
    approvedByName: r.approved_by_name,
    declinedAt: r.declined_at,
    declinedByName: r.declined_by_name,
    declinedReasons: r.declined_reasons,
    reversedAt: r.reversed_at,
    reversedByName: r.reversed_by_name,
    reversedReasons: r.reversed_reasons,
  };
}
