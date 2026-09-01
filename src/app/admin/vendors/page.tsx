import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import { toggleVendorActive, deleteVendor } from "./actions";
import styles from "../admin.module.css";

export default async function AdminVendorsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: vendors }, { data: deals }] = await Promise.all([
    supabase.from("vendors").select("id, name, is_active").order("name"),
    supabase.from("deals").select("vendor_id"),
  ]);

  const dealCountByVendor = new Map<string, number>();
  for (const d of deals ?? []) {
    dealCountByVendor.set(d.vendor_id, (dealCountByVendor.get(d.vendor_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className={styles.headerRow}>
        <h2>Vendors</h2>
        <Link href="/admin/vendors/new" className={styles.linkBtn}>
          + New vendor
        </Link>
      </div>
      <p className={styles.hint} style={{ marginBottom: "var(--space-md)" }}>
        The merchant side of a deal. Contact details stay admin-only — only the name is ever
        shown publicly.
      </p>

      {!vendors || vendors.length === 0 ? (
        <p className={styles.empty}>No vendors yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Deals</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className={styles.rowTitle}>{vendor.name}</td>
                  <td className={styles.rowMeta}>{dealCountByVendor.get(vendor.id) ?? 0}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${vendor.is_active ? styles.badgePublished : styles.badgeDraft}`}
                    >
                      {vendor.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link href={`/admin/vendors/${vendor.id}`} className={styles.linkBtn}>
                        Edit
                      </Link>
                      <form action={toggleVendorActive.bind(null, vendor.id, !vendor.is_active)}>
                        <button type="submit" className={styles.linkBtn}>
                          {vendor.is_active ? "Deactivate" : "Activate"}
                        </button>
                      </form>
                      <form action={deleteVendor.bind(null, vendor.id)}>
                        <button type="submit" className={styles.dangerBtn}>
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
