import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/require-admin";
import { PageHeader } from "@/components/ui/PageHeader";
import { AdminNav } from "./AdminNav";
import styles from "./admin.module.css";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <PageHeader eyebrow="Behind the counter" title="Admin" />
      <div className={`container ${styles.page}`}>
        <AdminNav />
        {children}
      </div>
    </>
  );
}
