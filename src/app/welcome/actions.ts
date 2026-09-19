"use server";

import { createClient } from "@/lib/supabase/server";
import { validate, type WelcomeAnswers } from "./validate";

export async function completeOnboarding(answers: WelcomeAnswers) {
  const checked = validate(answers);
  if ("error" in checked) return { error: checked.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Sign in again." };

  // No onboarded_at guard on the update: re-running this is harmless, and a
  // member who reloads mid-step should not be locked out of finishing.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: answers.displayName.trim(),
      date_of_birth: checked.dateOfBirth,
      country: answers.country,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return { ok: true as const };
}
