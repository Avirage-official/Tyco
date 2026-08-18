import Link from "next/link";
import { requireAdmin } from "@/lib/admin/require-admin";
import styles from "./admin.module.css";

async function countPublished(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  table: "creators" | "portfolio_items" | "events" | "products"
) {
  const { count } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("is_published", true);
  return count ?? 0;
}

export default async function AdminDashboard() {
  const { supabase } = await requireAdmin();

  const [creators, portfolio, events, products, pendingOrders, webhookErrors] = await Promise.all([
    countPublished(supabase, "creators"),
    countPublished(supabase, "portfolio_items"),
    countPublished(supabase, "events"),
    countPublished(supabase, "products"),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .then((r) => r.count ?? 0),
    supabase
      .from("webhook_errors")
      .select("*", { count: "exact", head: true })
      .then((r) => r.count ?? 0),
  ]);

  const stats = [
    { label: "Published creators", value: creators, href: "/admin/creators" },
    { label: "Portfolio items", value: portfolio, href: "/admin/portfolio" },
    { label: "Published events", value: events, href: "/admin/events" },
    { label: "Products live", value: products, href: "/admin/products" },
    { label: "Pending orders", value: pendingOrders, href: "/admin/orders" },
    { label: "Webhook errors", value: webhookErrors, href: "/admin/debug" },
  ];

  return (
    <div className={styles.grid}>
      {stats.map((stat) => (
        <Link key={stat.label} href={stat.href} className={styles.stat}>
          <div className={styles.statValue}>{stat.value}</div>
          <div className={styles.statLabel}>{stat.label}</div>
        </Link>
      ))}
    </div>
  );
}
