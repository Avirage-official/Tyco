import { requireAdmin } from "@/lib/admin/require-admin";
import { PortfolioForm } from "../PortfolioForm";

export default async function NewPortfolioItemPage() {
  await requireAdmin();
  return (
    <div>
      <h2 style={{ marginBottom: "var(--space-md)" }}>New portfolio item</h2>
      <PortfolioForm />
    </div>
  );
}
