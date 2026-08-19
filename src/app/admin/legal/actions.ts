"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export async function updateLegalTerms(legalTerms: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("site_settings")
    .update({ legal_terms: legalTerms || null })
    .eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/legal");
  revalidatePath("/terms");
}
