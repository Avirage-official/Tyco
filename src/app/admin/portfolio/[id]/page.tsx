import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { PortfolioForm } from "../PortfolioForm";

export default async function EditPortfolioItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: item } = await supabase
    .from("portfolio_items")
    .select("id, title, description, category, cover_url, images")
    .eq("id", id)
    .single();

  if (!item) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit portfolio item</h2>
      <PortfolioForm item={item} />
    </div>
  );
}
