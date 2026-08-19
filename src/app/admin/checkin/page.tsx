import { requireAdmin } from "@/lib/admin/require-admin";
import { CheckInForm } from "./CheckInForm";
import styles from "../admin.module.css";

export default async function AdminCheckInPage() {
  await requireAdmin();

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Check in tickets</h2>
      </div>
      <p className={styles.hint} style={{ marginBottom: "var(--space-md)" }}>
        Type the reference code shown on the buyer&rsquo;s ticket. A ticket can only be checked
        in once — re-checking a used code will say so instead of letting them back in.
      </p>
      <CheckInForm />
    </div>
  );
}
