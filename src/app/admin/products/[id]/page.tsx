import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ProductForm } from "../ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: product }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, price_cents, category, images")
      .eq("id", id)
      .single(),
    supabase.from("product_variants").select("size, stock").eq("product_id", id).order("size"),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit product</h2>
      <ProductForm product={product} variants={variants ?? []} />
    </div>
  );
}
