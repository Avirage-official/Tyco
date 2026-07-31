import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ConfirmationContent } from "./ConfirmationContent";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, customer_email")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  return <ConfirmationContent order={order} />;
}
