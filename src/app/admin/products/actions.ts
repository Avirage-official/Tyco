"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type ProductInput = {
  name: string;
  description: string | null;
  price_cents: number;
  category: string | null;
  images: string[];
};

export type VariantInput = { size: string; stock: number };

function revalidateProducts() {
  revalidatePath("/admin/products");
  revalidatePath("/shop");
}

async function replaceVariants(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
  variants: VariantInput[]
) {
  await supabase.from("product_variants").delete().eq("product_id", productId);
  const rows = variants
    .filter((v) => v.size.trim().length > 0)
    .map((v) => ({ product_id: productId, size: v.size.trim(), stock: v.stock }));
  if (rows.length > 0) {
    const { error } = await supabase.from("product_variants").insert(rows);
    if (error) throw new Error(error.message);
  }
}

export async function createProduct(input: ProductInput, variants: VariantInput[]) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("products").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  await replaceVariants(supabase, data.id, variants);
  revalidateProducts();
}

export async function updateProduct(id: string, input: ProductInput, variants: VariantInput[]) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  await replaceVariants(supabase, id, variants);
  revalidateProducts();
}

export async function toggleProductPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("products")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidateProducts();
}

export async function deleteProduct(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateProducts();
}
