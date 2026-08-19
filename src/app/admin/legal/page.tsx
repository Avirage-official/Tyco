import { requireAdmin } from "@/lib/admin/require-admin";
import { DEFAULT_LEGAL_TERMS } from "@/lib/legal";
import { LegalForm } from "./LegalForm";

export default async function AdminLegalPage() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase.from("site_settings").select("legal_terms").eq("id", true).single();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Legal</h2>
      <LegalForm initialValue={settings?.legal_terms || DEFAULT_LEGAL_TERMS} />
    </div>
  );
}
