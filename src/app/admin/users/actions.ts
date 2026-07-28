"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

const PERMANENT_BAN = "876000h"; // ~100 years — GoTrue has no literal "forever"

export async function blockUser(userId: string) {
  const { user } = await requireAdmin();
  if (userId === user.id) throw new Error("You can't block your own account.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: PERMANENT_BAN });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function unblockUser(userId: string) {
  await requireAdmin();

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}

export async function deleteUser(userId: string) {
  const { user } = await requireAdmin();
  if (userId === user.id) throw new Error("You can't delete your own account.");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
}
