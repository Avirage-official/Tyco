"use client";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import type { DealSummary } from "@/lib/deals/catalog";
import { formatPrice } from "@/lib/format";

export function availabilityLabel(capRemaining: number) {
  if (capRemaining <= 0) return { tone: "neutral" as const, text: "Fully claimed this month" };
  return { tone: "success" as const, text: `${capRemaining} left this month` };
}

export function DealCard({ deal }: { deal: DealSummary }) {
  const availability = availabilityLabel(deal.capRemaining);
  const meta = [deal.subcategoryName, deal.locations[0]].filter(Boolean).join(" · ");

  return (
    <Card
      href={`/deals/${deal.id}`}
      ratio="3/4"
      media={
        <CoverImage
          src={deal.coverUrl}
          alt={`${deal.title} at ${deal.vendorName}`}
          sizes="(min-width: 1000px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      }
      badge={<Badge tone={availability.tone}>{availability.text}</Badge>}
      kicker={deal.vendorName}
      title={deal.title}
      meta={meta || undefined}
      price={formatPrice(deal.memberPriceCents, deal.currency)}
      priceWas={deal.originalPriceCents != null ? formatPrice(deal.originalPriceCents, deal.currency) : null}
    />
  );
}
