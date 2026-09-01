"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { deleteStorageUrls } from "@/lib/supabase/storage-cleanup";

export type ProductInput = {
  name: string;
  description: string | null;
  price_cents: number;
  category: string | null;
  images: string[];
  is_featured: boolean;
};

export type VariantInput = { size: string; stock: number; merchizeVariantCode?: string };

function revalidateProducts() {
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
}

async function replaceVariants(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
  variants: VariantInput[]
) {
  const rows = variants
    .filter((v) => v.size.trim().length > 0)
    .map((v) => ({
      product_id: productId,
      size: v.size.trim(),
      stock: v.stock,
      merchize_variant_code: v.merchizeVariantCode?.trim() || null,
    }));

  // Upsert by (product_id, size) instead of delete-then-recreate: a size
  // that's still on the form keeps its existing variant id, so an
  // order_items row that references it (not-null FK, no cascade) never
  // gets orphaned by an ordinary edit — that used to break saving any
  // product that had ever sold.
  if (rows.length > 0) {
    const { error } = await supabase
      .from("product_variants")
      .upsert(rows, { onConflict: "product_id,size" });
    if (error) throw new Error(error.message);
  }

  const { data: existing } = await supabase
    .from("product_variants")
    .select("id, size")
    .eq("product_id", productId);

  const keptSizes = new Set(rows.map((r) => r.size));
  const removed = (existing ?? []).filter((v) => !keptSizes.has(v.size));

  for (const variant of removed) {
    const { error } = await supabase.from("product_variants").delete().eq("id", variant.id);
    if (error) {
      // Still referenced by past order_items — can't delete it, so take
      // it off sale instead of failing the whole save.
      await supabase.from("product_variants").update({ stock: 0 }).eq("id", variant.id);
    }
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

  const { data: variants } = await supabase.from("product_variants").select("id").eq("product_id", id);
  if (variants && variants.length > 0) {
    const { count } = await supabase
      .from("order_items")
      .select("*", { count: "exact", head: true })
      .in(
        "variant_id",
        variants.map((v) => v.id)
      );
    if (count && count > 0) {
      throw new Error("Can't delete — this product has past orders against it. Unpublish it instead.");
    }
  }

  const { data: product } = await supabase.from("products").select("images").eq("id", id).single();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (product?.images) await deleteStorageUrls(supabase, "products", product.images);

  revalidateProducts();
}
