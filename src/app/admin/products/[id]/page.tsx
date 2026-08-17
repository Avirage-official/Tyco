import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/require-admin";
import { ProductForm } from "../ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const [{ data: product }, { data: variants }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, price_cents, category, images, is_featured")
      .eq("id", id)
      .single(),
    supabase
      .from("product_variants")
      .select("size, stock, merchize_variant_code")
      .eq("product_id", id)
      .order("size"),
  ]);

  if (!product) notFound();

  const mappedVariants = (variants ?? []).map((v) => ({
    size: v.size,
    stock: v.stock,
    merchizeVariantCode: v.merchize_variant_code ?? "",
  }));

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Edit product</h2>
      <ProductForm product={product} variants={mappedVariants} />
    </div>
  );
}
