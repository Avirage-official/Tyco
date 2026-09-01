import { requireAdmin } from "@/lib/admin/require-admin";
import { DealForm } from "../DealForm";
import { getDealFormData } from "../form-data";

export default async function NewDealPage() {
  const { supabase } = await requireAdmin();
  const { vendors, categories, gatewayFeePercent } = await getDealFormData(supabase);

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New deal</h2>
      <DealForm vendors={vendors} categories={categories} gatewayFeePercent={gatewayFeePercent} />
    </div>
  );
}
