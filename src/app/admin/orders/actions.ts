"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitOrderToMerchize } from "@/lib/checkout/fulfillment";

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
