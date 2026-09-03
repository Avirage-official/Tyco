"use client";

import { useRouter } from "next/navigation";
import { ApproveRedemptionButton } from "../deal-checkins/ApproveRedemptionButton";

export function RedemptionRowAction({ redemptionId, locations }: { redemptionId: string; locations: string[] }) {
  const router = useRouter();

  return (
    <ApproveRedemptionButton
      redemptionId={redemptionId}
      locations={locations}
      onApproved={() => router.refresh()}
    />
  );
}
