import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { VendorForm } from "../VendorForm";

export default async function EditVendorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: vendor }, { data: notes }] = await Promise.all([
    supabase.from("vendors").select("id, name, is_active").eq("id", id).single(),
    supabase
      .from("vendor_admin_notes")
      .select("contact_name, contact_email, contact_phone, notes")
      .eq("vendor_id", id)
      .maybeSingle(),
  ]);

  if (!vendor) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit vendor</h2>
      <VendorForm vendor={vendor} notes={notes ?? undefined} />
    </div>
  );
}
