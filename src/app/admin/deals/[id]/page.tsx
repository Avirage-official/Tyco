import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { DealForm } from "../DealForm";
import { getDealFormData } from "../form-data";

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: deal }, formData] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, vendor_id, subcategory_id, title, description, cover_url, locations, vendor_rate_cents, margin_percent, redemptions_per_cycle"
      )
      .eq("id", id)
      .single(),
    getDealFormData(supabase),
  ]);

  if (!deal) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit deal</h2>
      <DealForm
        deal={deal}
        vendors={formData.vendors}
        categories={formData.categories}
        gatewayFeePercent={formData.gatewayFeePercent}
      />
    </div>
  );
}
