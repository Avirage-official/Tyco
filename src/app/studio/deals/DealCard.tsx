"use client";

import { useId, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { formatPrice } from "@/lib/format";
import { IconPin } from "@/components/icons";
import { DealRedeem } from "./DealRedeem";
import styles from "../studio.module.css";

type Deal = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  locations: string[];
  currency: string;
};

export function DealCard({
  deal,
  subcategoryName,
  vendorName,
  memberPriceCents,
  originalPriceCents,
  capRemaining,
  signedIn,
}: {
  deal: Deal;
  subcategoryName: string;
  vendorName: string;
  memberPriceCents: number;
  originalPriceCents: number | null;
  capRemaining: number | null;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  return (
    <>
      <button type="button" className={styles.posterCard} onClick={() => setOpen(true)}>
        <span
          className={styles.posterMedia}
          style={deal.cover_url ? { backgroundImage: `url(${deal.cover_url})` } : undefined}
          aria-hidden
        />
        <span className={styles.posterScrim} aria-hidden />
        <div className={styles.posterBody}>
          <p className={styles.dealSubcategory}>{subcategoryName}</p>
          <p className={styles.posterName}>{deal.title}</p>
          <p className={styles.posterTagline}>{vendorName}</p>
          {deal.locations.length > 0 && (
            <p className={styles.dealLocations}>
              <IconPin className={styles.dealLocationIcon} />
              {deal.locations.join(" · ")}
            </p>
          )}
          <div className={styles.dealPriceRow}>
            <span className={styles.posterName} style={{ fontSize: "1rem" }}>
              {formatPrice(memberPriceCents, deal.currency)}
            </span>
            {originalPriceCents != null && (
              <span className={styles.dealOriginalPrice}>{formatPrice(originalPriceCents, deal.currency)}</span>
            )}
          </div>
        </div>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} labelledBy={titleId}>
        <div className={styles.detailHeroImage}>
          <span
            className={styles.detailMedia}
            style={deal.cover_url ? { backgroundImage: `url(${deal.cover_url})` } : undefined}
            aria-hidden
          />
          <span className={styles.detailScrim} aria-hidden />
        </div>
        <div className={styles.detailBody}>
          <p className={styles.detailEyebrow}>{subcategoryName}</p>
          <h2 id={titleId} className={styles.detailTitle}>
            {deal.title}
          </h2>
          <div className={styles.detailMetaRow}>
            <span>{vendorName}</span>
            {deal.locations.length > 0 && <span>{deal.locations.join(" · ")}</span>}
          </div>
          {deal.description && <p className={styles.detailDescription}>{deal.description}</p>}

          <div className={styles.detailBookingPanel}>
            <p className={styles.detailPrice}>
              {formatPrice(memberPriceCents, deal.currency)}
              {originalPriceCents != null && (
                <span className={styles.detailPriceOriginal}>{formatPrice(originalPriceCents, deal.currency)}</span>
              )}
            </p>
            <div className={styles.dealAction}>
              <DealRedeem
                dealId={deal.id}
                memberPriceCents={memberPriceCents}
                currency={deal.currency}
                capRemaining={capRemaining}
                signedIn={signedIn}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
