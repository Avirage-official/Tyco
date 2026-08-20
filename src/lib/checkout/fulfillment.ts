import "server-only";
import type { createAdminClient } from "@/lib/supabase/admin";
import { createMerchizeOrder, type MerchizeLineItem, type MerchizeShipping } from "@/lib/checkout/merchize";
import { logWebhookError } from "@/lib/checkout/webhookErrors";

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Submits a paid order to Merchize for fulfilment. Safe to call repeatedly —
 * no-ops once merchize_status is already set, so both the Revolut webhook
 * (on every completed-payment delivery, not just the one that flips the
 * order to paid) and the admin "Resubmit to Merchize" action can call this
 * without risking a duplicate order at Merchize. Never throws — failures
 * are logged to webhook_errors for manual follow-up instead.
 */
export async function submitOrderToMerchize(supabase: AdminClient, orderId: string) {
  const { data: order } = await supabase
    .from("orders")
    .select("customer_email, currency, shipping_address, status, merchize_status")
    .eq("id", orderId)
    .single();

  if (!order) {
    await logWebhookError("merchize", "Submit skipped — order not found", { orderId });
    return;
  }

  if (order.merchize_status) {
    return;
  }

  if (order.status !== "paid" && order.status !== "fulfilled") {
    await logWebhookError("merchize", "Submit skipped — order is not paid", {
      orderId,
      status: order.status,
    });
    return;
  }

  const shippingAddress = (order.shipping_address ?? null) as Partial<MerchizeShipping> | null;
  if (!shippingAddress || !shippingAddress.address1) {
    await logWebhookError("merchize", "Submit skipped — no shipping address on order", { orderId });
    return;
  }

  const { data: orderItems } = await supabase
    .from("order_items")
    .select("variant_id, quantity, unit_price_cents")
    .eq("order_id", orderId);

  if (!orderItems || orderItems.length === 0) {
    await logWebhookError("merchize", "Submit skipped — order has no line items", { orderId });
    return;
  }

  try {
    const variantIds = orderItems.map((item) => item.variant_id);
    const { data: variants } = await supabase
      .from("product_variants")
      .select("id, product_id, size, sku, merchize_variant_code")
      .in("id", variantIds);

    const variantById = new Map((variants ?? []).map((v) => [v.id, v]));

    const productIds = [...new Set((variants ?? []).map((v) => v.product_id))];
    const { data: products } = await supabase.from("products").select("id, images").in("id", productIds);

    const productById = new Map((products ?? []).map((p) => [p.id, p]));

    const merchizeItems: MerchizeLineItem[] = orderItems.map((item) => {
      const variant = variantById.get(item.variant_id);
      if (!variant?.merchize_variant_code) {
        throw new Error(`No Merchize variant code set for product_variants.id=${item.variant_id}`);
      }

      const product = productById.get(variant.product_id);
      const image = product?.images?.[0];
      if (!image) {
        throw new Error(`No product image available for product_variants.id=${item.variant_id}`);
      }

      return {
        // Stable per product across every order — Merchize groups items
        // sharing this id into one product, in addition to the merchize_sku
        // catalog match below.
        productId: variant.product_id,
        sku: variant.sku,
        merchizeSku: variant.merchize_variant_code,
        price: item.unit_price_cents / 100,
        currency: order.currency,
        quantity: item.quantity,
        image,
      };
    });

    const shipping: MerchizeShipping = {
      email: order.customer_email ?? "",
      firstName: shippingAddress.firstName ?? "",
      lastName: shippingAddress.lastName ?? "",
      address1: shippingAddress.address1 ?? "",
      address2: shippingAddress.address2 ?? "",
      city: shippingAddress.city ?? "",
      region: shippingAddress.region ?? "",
      postcode: shippingAddress.postcode ?? "",
      countryCode: shippingAddress.countryCode ?? "",
      phone: shippingAddress.phone ?? "",
    };

    const merchizeOrder = await createMerchizeOrder({ orderId, shipping, items: merchizeItems });

    await supabase
      .from("orders")
      .update({
        merchize_order_id: merchizeOrder.data?._id ?? null,
        merchize_status: "submitted",
      })
      .eq("id", orderId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await logWebhookError("merchize", `Submission failed: ${message}`, { orderId });
  }
}
