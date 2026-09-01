"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type VendorInput = { name: string; is_active: boolean };

export type VendorNotesInput = {
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
};

function revalidateVendors() {
  revalidatePath("/admin/vendors");
}

async function saveNotes(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  vendorId: string,
  notes: VendorNotesInput
) {
  const { error } = await supabase
    .from("vendor_admin_notes")
    .upsert({ vendor_id: vendorId, ...notes });
  if (error) throw new Error(error.message);
}

export async function createVendor(input: VendorInput, notes: VendorNotesInput) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("vendors").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  await saveNotes(supabase, data.id, notes);
  revalidateVendors();
  return data.id;
}

export async function updateVendor(id: string, input: VendorInput, notes: VendorNotesInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("vendors").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  await saveNotes(supabase, id, notes);
  revalidateVendors();
}

export async function toggleVendorActive(id: string, isActive: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("vendors").update({ is_active: isActive }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateVendors();
}

export async function deleteVendor(id: string) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", id);
  if (count && count > 0) {
    throw new Error(`Can't delete — ${count} deal(s) reference this vendor. Deactivate it instead.`);
  }

  const { error } = await supabase.from("vendors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateVendors();
}
