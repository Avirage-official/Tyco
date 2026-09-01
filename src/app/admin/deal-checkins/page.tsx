import { requireAdmin } from "@/lib/admin/require-admin";
import { DealCheckInForm } from "./DealCheckInForm";
import styles from "../admin.module.css";

export default async function AdminDealCheckInsPage() {
  await requireAdmin();

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Approve deals</h2>
      </div>
      <p className={styles.hint} style={{ marginBottom: "var(--space-md)" }}>
        Type the reference code the member shows at the vendor counter, then tap Approve on the
        vendor&rsquo;s behalf. A redemption can only be approved once.
      </p>
      <DealCheckInForm />
    </div>
  );
}
