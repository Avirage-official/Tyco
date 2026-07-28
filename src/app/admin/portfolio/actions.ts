"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type PortfolioInput = {
  title: string;
  description: string | null;
  category: string | null;
  cover_url: string | null;
  images: string[];
};

function revalidatePortfolio() {
  revalidatePath("/admin/portfolio");
  revalidatePath("/studio");
}

export async function createPortfolioItem(input: PortfolioInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("portfolio_items").insert(input);
  if (error) throw new Error(error.message);
  revalidatePortfolio();
}

export async function updatePortfolioItem(id: string, input: PortfolioInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("portfolio_items").update(input).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePortfolio();
}

export async function togglePortfolioPublish(id: string, isPublished: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("portfolio_items")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePortfolio();
}

export async function deletePortfolioItem(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePortfolio();
}
