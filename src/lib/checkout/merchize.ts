import "server-only";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export type MerchizeShipping = {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  region: string;
  postcode: string;
  countryCode: string;
  phone: string;
};

export type MerchizeLineItem = {
  name: string;
  sku?: string | null;
  merchizeSku: string;
  price: number;
  currency: string;
  quantity: number;
  image: string;
  attributes: { name: string; option: string }[];
};

/**
 * Creates a fulfilment order at Merchize via their "Import external orders"
 * endpoint (POST /order/external/orders, Bearer auth with the Access Token
 * from their dashboard's API Reference page). Called from
 * submitOrderToMerchize once an order is confirmed paid.
 *
 * MERCHIZE_API_BASE_URL must be the full base URL shown on that page,
 * including the store-specific path (e.g.
 * https://bo-group-1-2.merchize.com/vnsnr6g/bo-api) — the bare domain alone
 * doesn't route to a store and returns a Cloudflare 502.
 */
export async function createMerchizeOrder({
  orderId,
  shipping,
  items,
}: {
  orderId: string;
  shipping: MerchizeShipping;
  items: MerchizeLineItem[];
}) {
  const baseUrl = requireEnv("MERCHIZE_API_BASE_URL").replace(/\/+$/, "");
  const token = requireEnv("MERCHIZE_ACCESS_TOKEN");

  const res = await fetch(`${baseUrl}/order/external/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderId,
      identifier: "tyco.world",
      // No sandbox/test flag exists in Merchize's documented schema — tag
      // non-live submissions instead of inventing an unrecognized field.
      tags: process.env.MERCHIZE_MODE === "live" ? [] : ["test"],
      shipping_info: {
        full_name: `${shipping.firstName} ${shipping.lastName}`.trim(),
        address_1: shipping.address1,
        address_2: shipping.address2 ?? "",
        city: shipping.city,
        state: shipping.region,
        postcode: shipping.postcode,
        country: shipping.countryCode,
        email: shipping.email,
        phone: shipping.phone,
      },
      items: items.map((item) => ({
        name: item.name,
        sku: item.sku ?? undefined,
        merchize_sku: item.merchizeSku,
        price: item.price,
        currency: item.currency,
        quantity: item.quantity,
        image: item.image,
        attributes: item.attributes,
      })),
    }),
  });

  const rawBody = await res.text();
  let body: { success?: boolean; message?: string; data?: { _id?: string } } | null = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  if (!res.ok || !body || body.success === false) {
    throw new Error(`Merchize order creation failed (${res.status}): ${body?.message ?? rawBody}`);
  }

  return body;
}
