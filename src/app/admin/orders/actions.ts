"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

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
