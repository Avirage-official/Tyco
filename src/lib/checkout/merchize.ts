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

export type MerchizeLineItem = { variantCode: string; quantity: number };

/**
 * Creates a fulfilment order at Merchize. Called from the Revolut webhook
 * once an order is confirmed paid — see src/app/api/webhooks/revolut/route.ts.
 *
 * HONEST CAVEAT: Merchize's docs (as available when this was written) cover
 * auth (Bearer token) and webhook retry rules, but not the exact order-
 * creation request schema. The field names below (external_id, the
 * shipping.* fields, items[].variant_code) are a best-effort reconstruction
 * from their general order-import shape, not a confirmed spec. Place one
 * real order and check the Vercel function logs for this route if Merchize
 * rejects it — the fix is almost certainly a field name here, not the
 * surrounding logic.
 */
export async function createMerchizeOrder({
  externalId,
  shipping,
  items,
}: {
  externalId: string;
  shipping: MerchizeShipping;
  items: MerchizeLineItem[];
}) {
  const baseUrl = requireEnv("MERCHIZE_API_BASE_URL").replace(/\/+$/, "");
  const token = requireEnv("MERCHIZE_ACCESS_TOKEN");

  const res = await fetch(`${baseUrl}/api/beta/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      external_id: externalId,
      is_test: process.env.MERCHIZE_MODE !== "live",
      shipping_method: "standard",
      shipping: {
        email: shipping.email,
        firstname: shipping.firstName,
        lastname: shipping.lastName,
        address_1: shipping.address1,
        address_2: shipping.address2 ?? "",
        city: shipping.city,
        region: shipping.region,
        postcode: shipping.postcode,
        country_id: shipping.countryCode,
        telephone: shipping.phone,
      },
      items: items.map((item) => ({
        variant_code: item.variantCode,
        quantity: item.quantity,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Merchize order creation failed (${res.status}): ${body}`);
  }

  return res.json() as Promise<Record<string, unknown>>;
}
