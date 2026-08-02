"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";

export type SiteSettingsInput = {
  next_project_title: string | null;
  next_project_body: string | null;
  next_project_image_url: string | null;
  mission_raised_cents: number;
  mission_goal_cents: number;
};

export async function updateSiteSettings(input: SiteSettingsInput) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("site_settings").update(input).eq("id", true);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
