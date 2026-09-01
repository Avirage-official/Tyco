"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteFromBucket, uploadToBucket } from "@/lib/supabase/upload";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { createDeal, updateDeal, type DealInput } from "./actions";
import styles from "../admin.module.css";

type Vendor = { id: string; name: string };
type CategoryWithSubcategories = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

type Deal = {
  id: string;
  vendor_id: string;
  subcategory_id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  locations: string[];
  vendor_rate_cents: number;
  margin_percent: number;
  original_price_cents: number | null;
  redemptions_per_cycle: number;
};

export function DealForm({
  deal,
  vendors,
  categories,
  gatewayFeePercent,
}: {
  deal?: Deal;
  vendors: Vendor[];
  categories: CategoryWithSubcategories[];
  gatewayFeePercent: number;
}) {
  const router = useRouter();
  const [vendorId, setVendorId] = useState(deal?.vendor_id ?? vendors[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState(
    deal?.subcategory_id ?? categories[0]?.subcategories[0]?.id ?? ""
  );
  const [title, setTitle] = useState(deal?.title ?? "");
  const [description, setDescription] = useState(deal?.description ?? "");
  const coverUrl = deal?.cover_url ?? null;
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [locations, setLocations] = useState<string[]>(
    deal?.locations && deal.locations.length > 0 ? deal.locations : [""]
  );
  const [vendorRate, setVendorRate] = useState(
    deal ? (deal.vendor_rate_cents / 100).toFixed(2) : ""
  );
  const [marginPercent, setMarginPercent] = useState(
    deal ? String(deal.margin_percent) : "10"
  );
  const [originalPrice, setOriginalPrice] = useState(
    deal?.original_price_cents != null ? (deal.original_price_cents / 100).toFixed(2) : ""
  );
  const [redemptionsPerCycle, setRedemptionsPerCycle] = useState(
    deal ? String(deal.redemptions_per_cycle) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorRateCents = Math.round(parseFloat(vendorRate || "0") * 100);
  const marginPct = parseFloat(marginPercent || "0");
  const memberPriceCents = Number.isFinite(vendorRateCents)
    ? Math.round(vendorRateCents * (1 + marginPct / 100))
    : 0;
  const checkoutTotalCents = Math.round(memberPriceCents * (1 + gatewayFeePercent / 100));
  const tycoMarginCents = memberPriceCents - vendorRateCents;
  const originalPriceCents = originalPrice.trim() ? Math.round(parseFloat(originalPrice) * 100) : null;
  const savingsCents =
    originalPriceCents != null ? originalPriceCents - memberPriceCents : null;

  function updateLocation(index: number, value: string) {
    setLocations((prev) => prev.map((l, i) => (i === index ? value : l)));
  }

  function removeLocation(index: number) {
    setLocations((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!vendorId) throw new Error("Select a vendor.");
      if (!subcategoryId) throw new Error("Select a category.");
      if (!Number.isFinite(vendorRateCents) || vendorRateCents < 0) {
        throw new Error("Enter a valid vendor rate.");
      }
      if (!Number.isFinite(marginPct) || marginPct < 0) {
        throw new Error("Enter a valid margin percent.");
      }
      if (originalPriceCents != null && (!Number.isFinite(originalPriceCents) || originalPriceCents < 0)) {
        throw new Error("Enter a valid compare-at price, or leave it blank.");
      }
      const redemptionsValue = Number(redemptionsPerCycle);
      if (!Number.isInteger(redemptionsValue) || redemptionsValue <= 0) {
        throw new Error("Redemptions per cycle must be a whole number greater than 0.");
      }

      let finalCoverUrl = coverUrl;
      if (coverFile) {
        finalCoverUrl = await uploadToBucket("deals", coverFile);
      }

      const cleanLocations = locations.map((l) => l.trim()).filter(Boolean);

      const input: DealInput = {
        vendor_id: vendorId,
        subcategory_id: subcategoryId,
        title,
        description: description || null,
        cover_url: finalCoverUrl,
        locations: cleanLocations,
        vendor_rate_cents: vendorRateCents,
        margin_percent: marginPct,
        original_price_cents: originalPriceCents,
        redemptions_per_cycle: redemptionsValue,
      };

      if (deal) {
        await updateDeal(deal.id, input);
      } else {
        await createDeal(input);
      }

      // Save succeeded — now safe to clean up whatever it orphaned.
      // Best-effort: a cleanup failure shouldn't surface as a save failure.
      if (finalCoverUrl !== coverUrl && coverUrl) {
        await deleteFromBucket("deals", coverUrl).catch(() => {});
      }

      router.push("/admin/deals");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="vendor">
            Vendor
          </label>
          {vendors.length === 0 ? (
            <p className={styles.hint}>No vendors yet — create one first.</p>
          ) : (
            <select
              id="vendor"
              className={styles.select}
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
            >
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="subcategory">
            Category
          </label>
          <select
            id="subcategory"
            className={styles.select}
            required
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
          >
            {categories.map((cat) => (
              <optgroup key={cat.id} label={cat.name}>
                {cat.subcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Deal title
        </label>
        <input
          id="title"
          className={styles.input}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={styles.textarea}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Locations</label>
        <p className={styles.hint}>Where this deal can be redeemed. Add one per address.</p>
        <div className={styles.variantsBlock}>
          {locations.map((loc, i) => (
            <div key={i} className={styles.variantRow}>
              <input
                className={styles.input}
                placeholder="Address"
                value={loc}
                onChange={(e) => updateLocation(i, e.target.value)}
              />
              <button type="button" className={styles.dangerBtn} onClick={() => removeLocation(i)}>
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.linkBtn}
            style={{ alignSelf: "flex-start" }}
            onClick={() => setLocations((prev) => [...prev, ""])}
          >
            + Add location
          </button>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="cover">
          Cover image
        </label>
        {coverUrl && <div className={styles.preview} style={{ backgroundImage: `url(${coverUrl})` }} />}
        <input
          id="cover"
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className={styles.fieldRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="vendor_rate">
            Vendor rate (SGD)
          </label>
          <input
            id="vendor_rate"
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            required
            value={vendorRate}
            onChange={(e) => setVendorRate(e.target.value)}
          />
          <p className={styles.hint}>What we pay the vendor per redemption.</p>
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="margin">
            TYCO margin (%)
          </label>
          <input
            id="margin"
            type="number"
            min="0"
            step="0.1"
            className={styles.input}
            required
            value={marginPercent}
            onChange={(e) => setMarginPercent(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="cap">
            Redemptions / month
          </label>
          <input
            id="cap"
            type="number"
            min="1"
            step="1"
            className={styles.input}
            required
            value={redemptionsPerCycle}
            onChange={(e) => setRedemptionsPerCycle(e.target.value)}
          />
          <p className={styles.hint}>Pool resets automatically each calendar month.</p>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="original_price">
          Compare-at price (SGD, optional)
        </label>
        <input
          id="original_price"
          type="number"
          min="0"
          step="0.01"
          className={styles.input}
          value={originalPrice}
          onChange={(e) => setOriginalPrice(e.target.value)}
        />
        <p className={styles.hint}>
          The vendor&rsquo;s normal walk-in price. Shown crossed out next to the member price —
          leave blank to skip the savings line.
        </p>
      </div>

      <div className={styles.stat}>
        <p className={styles.statLabel}>Auto-calculated</p>
        <p className={styles.rowMeta}>Member sees: {formatPrice(memberPriceCents, "sgd")}</p>
        {savingsCents != null && (
          <p className={styles.rowMeta}>
            Compare-at: {formatPrice(originalPriceCents!, "sgd")}
            {savingsCents > 0 && <> — saves {formatPrice(savingsCents, "sgd")}</>}
          </p>
        )}
        <p className={styles.rowMeta}>
          Checkout total ({gatewayFeePercent}% gateway fee): {formatPrice(checkoutTotalCents, "sgd")}
        </p>
        <p className={styles.rowMeta}>TYCO margin earned per redemption: {formatPrice(tycoMarginCents, "sgd")}</p>
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <Button type="submit" disabled={saving || vendors.length === 0}>
          {saving ? "Saving…" : deal ? "Save changes" : "Create deal"}
        </Button>
      </div>
    </form>
  );
}
