"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createRevolutOrder } from "@/lib/checkout/revolut";

export type CheckoutLine = { variantId: string; quantity: number };

export type ShippingDetails = {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  region: string;
  postcode: string;
  countryCode: string;
  phone: string;
};

const REQUIRED_SHIPPING_FIELDS: (keyof ShippingDetails)[] = [
  "firstName",
  "lastName",
  "address1",
  "city",
  "region",
  "postcode",
  "countryCode",
  "phone",
];

export async function startCheckout(lines: CheckoutLine[], shipping: ShippingDetails) {
  if (lines.length === 0) throw new Error("Your cart is empty.");

  for (const field of REQUIRED_SHIPPING_FIELDS) {
    if (!shipping[field] || !shipping[field]!.toString().trim()) {
      throw new Error("Fill in every shipping field so your order can be delivered.");
    }
  }

  // An account is required to check out — same reasoning as tickets: it's
  // how a buyer tracks the order afterward, and the service-role client
  // below has no session context of its own to link the order back to one.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();
  if (!user || !user.email) {
    throw new Error("Sign in to check out.");
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
      user_id: user.id,
      customer_email: user.email,
      status: "pending",
      currency,
      total_cents: totalCents,
      shipping_address: {
        firstName: shipping.firstName.trim(),
        lastName: shipping.lastName.trim(),
        address1: shipping.address1.trim(),
        address2: shipping.address2?.trim() || "",
        city: shipping.city.trim(),
        region: shipping.region.trim(),
        postcode: shipping.postcode.trim(),
        countryCode: shipping.countryCode.trim(),
        phone: shipping.phone.trim(),
      },
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
