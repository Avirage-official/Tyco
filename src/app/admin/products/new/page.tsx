import { requireAdmin } from "@/lib/admin/require-admin";
import { ProductForm } from "../ProductForm";

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New product</h2>
      <ProductForm />
    </div>
  );
}
