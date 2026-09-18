import { createClient } from "@/lib/supabase/server";
import { AuthSlideshow } from "./AuthSlideshow";
import styles from "./auth.module.css";

/**
 * Sign-in and sign-up share one composition: a photographic panel beside a
 * plain form column. It is the split that venue-led businesses — Resy,
 * Tock, Eventbrite, Mindbody — have settled on, for a reason that applies
 * here too: the picture carries the brand so the form does not have to,
 * which is what lets the form stay an uncontained column of fields rather
 * than a boxed-in widget floating in the middle of the page.
 *
 * The photographs are the gallery an admin already curates under
 * Settings → About. There is deliberately no second place to manage them,
 * and no photographs is a supported state, not a broken one.
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("about_gallery")
    .eq("id", true)
    .maybeSingle();

  const slides = data?.about_gallery ?? [];

  return (
    <div className={styles.split} data-bare={slides.length === 0}>
      <aside className={styles.panel}>
        <AuthSlideshow slides={slides} />
        <span className={styles.scrim} aria-hidden />
        <div className={styles.panelCopy}>
          <p className={styles.panelTitle}>The scene, at member prices.</p>
          <p className={styles.panelBody}>
            Member deals at the places creatives already spend on, and first
            access to every happening in the city.
          </p>
        </div>
      </aside>

      <div className={styles.formCol}>
        <div className={styles.form}>{children}</div>
      </div>
    </div>
  );
}
