import "server-only";
import type { createClient } from "@/lib/supabase/server";

export async function getDealFormData(supabase: Awaited<ReturnType<typeof createClient>>) {
  const [{ data: vendors }, { data: categories }, { data: subcategories }, { data: settings }] =
    await Promise.all([
      supabase.from("vendors").select("id, name").eq("is_active", true).order("name"),
      supabase.from("deal_categories").select("id, name").order("display_order"),
      supabase.from("deal_subcategories").select("id, category_id, name").order("display_order"),
      supabase.from("site_settings").select("deal_gateway_fee_percent").eq("id", true).maybeSingle(),
    ]);

  const categoriesWithSubs = (categories ?? []).map((cat) => ({
    id: cat.id,
    name: cat.name,
    subcategories: (subcategories ?? []).filter((s) => s.category_id === cat.id),
  }));

  return {
    vendors: vendors ?? [],
    categories: categoriesWithSubs,
    gatewayFeePercent: settings?.deal_gateway_fee_percent ?? 3,
  };
}
