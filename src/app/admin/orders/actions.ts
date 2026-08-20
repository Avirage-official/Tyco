"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitOrderToMerchize } from "@/lib/checkout/fulfillment";
import { getMerchizeOrderDetail } from "@/lib/checkout/merchize";
import { logWebhookError } from "@/lib/checkout/webhookErrors";

const STATUSES = ["pending", "paid", "fulfilled", "cancelled", "refunded"] as const;
type Status = (typeof STATUSES)[number];

function isStatus(value: unknown): value is Status {
  return typeof value === "string" && (STATUSES as readonly string[]).includes(value);
}

export async function updateOrderStatus(orderId: string, formData: FormData) {
  const { supabase } = await requireAdmin();
  const status = formData.get("status");

  if (!isStatus(status)) {
    throw new Error("Invalid status");
  }

  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
}

/**
 * Manually retries Merchize submission for a paid order — the fallback for
 * an order that reached "paid" without a Revolut webhook delivery ever
 * running submitOrderToMerchize against it (e.g. a manual status edit).
 * Uses the admin (service-role) client since submitOrderToMerchize reads
 * order_items/product_variants the same way the webhook does, bypassing RLS.
 */
export async function resubmitOrderToMerchize(orderId: string) {
  await requireAdmin();
  const admin = createAdminClient();
  await submitOrderToMerchize(admin, orderId);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/debug");
}

/**
 * Pulls an order's live status straight from Merchize instead of waiting on
 * their webhook — refreshes merchize_status with their real status string
 * (replacing the generic "submitted" marker set at creation) and records
 * which catalog item/variant it matched, so a duplicate-product mistake like
 * the Varsity Mesh one is visible from the admin instead of only in
 * Merchize's own dashboard.
 */
export async function checkMerchizeStatus(orderId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  try {
    const detail = await getMerchizeOrderDetail(orderId);
    if (!detail) {
      await logWebhookError("merchize", "Status check found no matching order at Merchize", { orderId });
      return;
    }

    const summary = (detail.items ?? [])
      .map((item) => [item.title, item.variant].filter(Boolean).join(" — "))
      .filter(Boolean)
      .join("; ");

    await admin
      .from("orders")
      .update({
        merchize_status: detail.order_status ?? null,
        merchize_item_summary: summary || null,
      })
      .eq("id", orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logWebhookError("merchize", `Status check failed: ${message}`, { orderId });
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/debug");
}
