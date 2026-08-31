import { requireAdmin } from "@/lib/admin/require-admin";
import { SettingsForm } from "./SettingsForm";

export default async function AdminSettingsPage() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase
    .from("site_settings")
    .select(
      "next_project_title, next_project_body, next_project_image_url, mission_raised_cents, mission_goal_cents, mission_blurb, about_gallery, dashboard_slide_images, dashboard_hidden_slides"
    )
    .eq("id", true)
    .single();

  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>Homepage</h2>
      <SettingsForm settings={settings} />
    </div>
  );
}
