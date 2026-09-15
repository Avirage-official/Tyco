import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { ConfirmationContent } from "./ConfirmationContent";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;
  if (!orderId) notFound();

  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_cents, currency, customer_email, user_id")
    .eq("id", orderId)
    .single();

  // Checkout requires an account, so every order has a user_id — this link
  // is only ever meant for the customer who placed it, not just anyone who
  // has the URL (an order UUID isn't guessable, but a leaked link
  // shouldn't expose someone else's email/total either).
  if (!order || order.user_id !== user.id) notFound();

  return <ConfirmationContent order={order} />;
}
