"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRevolutOrder } from "@/lib/checkout/revolut";

export type CheckoutLine = { variantId: string; quantity: number };

export async function startCheckout(lines: CheckoutLine[], email: string) {
  if (lines.length === 0) throw new Error("Your cart is empty.");

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !trimmedEmail.includes("@")) {
    throw new Error("Enter a valid email so we can send your receipt.");
  }

  const supabase = createAdminClient();

  // Re-validate every line against the database — never trust the client's
  // cart contents for price or stock, only variant id + quantity.
  const variantIds = lines.map((line) => line.variantId);
  const { data: variants, error: variantsError } = await supabase
    .from("product_variants")
    .select("id, stock, product_id")
    .in("id", variantIds);
  if (variantsError) throw new Error(variantsError.message);

  const variantById = new Map((variants ?? []).map((v) => [v.id, v]));
  const productIds = Array.from(new Set((variants ?? []).map((v) => v.product_id)));

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, price_cents, currency, is_published")
    .in("id", productIds);
  if (productsError) throw new Error(productsError.message);

  const productById = new Map((products ?? []).map((p) => [p.id, p]));

  let totalCents = 0;
  let currency = "usd";
  const orderItemRows: { variant_id: string; quantity: number; unit_price_cents: number }[] = [];

  for (const line of lines) {
    const variant = variantById.get(line.variantId);
    const product = variant ? productById.get(variant.product_id) : undefined;

    if (!variant || !product || !product.is_published) {
      throw new Error("One of the items in your cart is no longer available.");
    }
    if (line.quantity < 1 || line.quantity > variant.stock) {
      throw new Error(`Only ${variant.stock} left in stock for one of your items.`);
    }

    totalCents += product.price_cents * line.quantity;
    currency = product.currency;
    orderItemRows.push({
      variant_id: variant.id,
      quantity: line.quantity,
      unit_price_cents: product.price_cents,
    });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_email: trimmedEmail,
      status: "pending",
      currency,
      total_cents: totalCents,
    })
    .select("id")
    .single();
  if (orderError || !order) throw new Error(orderError?.message ?? "Could not start checkout.");

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItemRows.map((row) => ({ ...row, order_id: order.id })));
  if (itemsError) throw new Error(itemsError.message);

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? `https://${requestHeaders.get("host")}`;

  const { checkoutUrl, revolutOrderId } = await createRevolutOrder({
    amountCents: totalCents,
    currency,
    orderId: order.id,
    redirectUrl: `${origin}/checkout/confirmation?order=${order.id}`,
  });

  if (revolutOrderId) {
    await supabase.from("orders").update({ revolut_order_id: revolutOrderId }).eq("id", order.id);
  }

  return { checkoutUrl };
}
