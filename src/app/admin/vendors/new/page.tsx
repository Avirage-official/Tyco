import { requireAdmin } from "@/lib/admin/require-admin";
import { VendorForm } from "../VendorForm";

export default async function NewVendorPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New vendor</h2>
      <VendorForm />
    </div>
  );
}
