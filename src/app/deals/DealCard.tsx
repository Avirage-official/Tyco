"use client";

import { Badge } from "@/components/ui/Badge";
import { Card, CardMeta, CardPrice, CardTitle } from "@/components/ui/Card";
import { CoverImage } from "@/components/ui/CoverImage";
import type { DealSummary } from "@/lib/deals/catalog";
import { formatPrice } from "@/lib/format";

export function availabilityLabel(capRemaining: number) {
  if (capRemaining <= 0) return { tone: "neutral" as const, text: "Fully claimed this month" };
  return { tone: "success" as const, text: `${capRemaining} left this month` };
}

export function DealCard({ deal }: { deal: DealSummary }) {
  const availability = availabilityLabel(deal.capRemaining);

  return (
    <Card
      href={`/deals/${deal.id}`}
      ratio="4/3"
      media={
        <CoverImage
          src={deal.coverUrl}
          alt={`${deal.title} at ${deal.vendorName}`}
          sizes="(min-width: 1000px) 25vw, (min-width: 640px) 33vw, 50vw"
        />
      }
      badge={<Badge tone={availability.tone}>{availability.text}</Badge>}
    >
      <CardMeta>{deal.vendorName}</CardMeta>
      <CardTitle>{deal.title}</CardTitle>
      <CardPrice
        original={deal.originalPriceCents != null ? formatPrice(deal.originalPriceCents, deal.currency) : undefined}
      >
        {formatPrice(deal.memberPriceCents, deal.currency)}
      </CardPrice>
    </Card>
  );
}
