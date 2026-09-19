"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isKnownCountry } from "@/app/welcome/countries";
import { validateName, validateDateOfBirth } from "@/app/welcome/validate";

type Result = { ok: true } | { error: string };

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/**
 * The welcome step's rules, reused rather than restated — a name that was
 * valid at sign-up must stay valid when it is edited, and the same date
 * that was refused there is refused here.
 */
export async function updateDisplayName(displayName: string): Promise<Result> {
  const problem = validateName(displayName);
  if (problem) return { error: problem };

  const { supabase, user } = await currentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName.trim() })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function updateDateOfBirth(parts: {
  day: string;
  month: string;
  year: string;
}): Promise<Result> {
  const checked = validateDateOfBirth(parts);
  if ("error" in checked) return { error: checked.error };

  const { supabase, user } = await currentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase
    .from("profiles")
    .update({ date_of_birth: checked.dateOfBirth })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { ok: true };
}

export async function updateCountry(country: string): Promise<Result> {
  if (!isKnownCountry(country)) return { error: "Choose where you're based." };

  const { supabase, user } = await currentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.from("profiles").update({ country }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/account");
  return { ok: true };
}

/**
 * Changing a password needs only the live session, which is why this works
 * at all here: the project has no email provider, so the reset-by-email
 * route does not exist and this is the only way a password ever changes.
 * Supabase re-checks length server-side; the minimum is mirrored so the
 * message is a sentence rather than an API error.
 */
export async function changePassword(password: string): Promise<Result> {
  if (password.length < 6) return { error: "Use at least 6 characters." };

  const { supabase, user } = await currentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  return { ok: true };
}

/**
 * Deleting an account needs the service role, so the session is checked
 * first and only ever deletes the caller's own id — the id is never taken
 * from the client. `on delete cascade` on profiles, tickets, redemptions
 * and orders takes the rest of the row set with it.
 */
export async function deleteOwnAccount(confirmation: string): Promise<Result> {
  if (confirmation.trim().toLowerCase() !== "delete") {
    return { error: 'Type "delete" to confirm.' };
  }

  const { user } = await currentUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  return { ok: true };
}
