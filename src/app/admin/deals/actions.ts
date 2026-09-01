"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type DealInput = {
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

// Single-currency site — SGD, not exposed as a form field (same convention
// as events).
const DEAL_CURRENCY = "sgd";

function revalidateDeals() {
  revalidatePath("/admin/deals");
}

export async function createDeal(input: DealInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("deals").insert({ ...input, currency: DEAL_CURRENCY });
  if (error) throw new Error(error.message);
  revalidateDeals();
}

export async function updateDeal(id: string, input: DealInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("deals")
    .update({ ...input, currency: DEAL_CURRENCY })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDeals();
}

export async function toggleDealPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("deals").update({ is_published: isPublished }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDeals();
}

export async function deleteDeal(id: string) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("deal_redemptions")
    .select("*", { count: "exact", head: true })
    .eq("deal_id", id);
  if (count && count > 0) {
    throw new Error(
      `Can't delete — ${count} redemption(s) were sold for this deal. Unpublish it instead to keep the record.`
    );
  }

  const { error } = await supabase.from("deals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDeals();
}

export async function toggleDealCategoryHidden(id: string, isHidden: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("deal_categories").update({ is_hidden: isHidden }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDeals();
}

export async function toggleDealSubcategoryHidden(id: string, isHidden: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("deal_subcategories").update({ is_hidden: isHidden }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateDeals();
}
