import "server-only";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Tags every order we send with this identifier and looks orders back up by
// it — lets order-detail lookups disambiguate if our order_id (our own
// orders.id, already unique) ever collided with another store's, per
// Merchize's own docs for the identifier field.
const MERCHIZE_IDENTIFIER = "tyco.world";

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
  productId: string;
  sku?: string | null;
  merchizeSku: string;
  price: number;
  currency: string;
  quantity: number;
  image: string;
};

/**
 * Creates a fulfilment order at Merchize via their "Import external orders
 * from Merchize catalog" endpoint (POST /order/external/orders/catalog,
 * Bearer auth with the Access Token from their dashboard's API Reference
 * page). Unlike the plain /order/external/orders endpoint, this one matches
 * items against an existing catalog product by merchize_sku (required here)
 * instead of always creating a new product per order. Called from
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

  const res = await fetch(`${baseUrl}/order/external/orders/catalog`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      order_id: orderId,
      identifier: MERCHIZE_IDENTIFIER,
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
        product_id: item.productId,
        sku: item.sku ?? undefined,
        merchize_sku: item.merchizeSku,
        price: item.price,
        currency: item.currency,
        quantity: item.quantity,
        image: item.image,
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

export type MerchizeOrderDetail = {
  order_status?: string;
  items?: { title?: string; sku?: string; variant?: string }[];
};

/**
 * Looks up an order's live fulfilment status at Merchize by the order_id we
 * submitted it under (GET /order/external/orders/order-detail). Used to
 * refresh merchize_status with Merchize's real status string on demand,
 * rather than only ever finding out via their webhook — useful since their
 * webhook retry is capped (5 attempts over 3 days per their docs) and a
 * missed delivery would otherwise leave merchize_status stale forever.
 */
export async function getMerchizeOrderDetail(externalNumber: string): Promise<MerchizeOrderDetail | null> {
  const baseUrl = requireEnv("MERCHIZE_API_BASE_URL").replace(/\/+$/, "");
  const token = requireEnv("MERCHIZE_ACCESS_TOKEN");

  const params = new URLSearchParams({ external_number: externalNumber, identifier: MERCHIZE_IDENTIFIER });
  const res = await fetch(`${baseUrl}/order/external/orders/order-detail?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const rawBody = await res.text();
  let body: { success?: boolean; message?: string; data?: MerchizeOrderDetail } | null = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  if (!res.ok || !body || body.success === false) {
    throw new Error(`Merchize order lookup failed (${res.status}): ${body?.message ?? rawBody}`);
  }

  return body.data ?? null;
}

export type MerchizeProgressStep = {
  event: string;
  status: string;
  expected?: string;
  actual?: string;
};

export type MerchizeOrderProgress = {
  order_progress?: MerchizeProgressStep[];
};

/**
 * Fetches an order's fulfilment timeline at Merchize (GET
 * /order/external/orders/order-progress) — order_imported, in_production,
 * shipment_started, delivered, etc, each done/pending with a timestamp.
 * Called live from the customer's orders page so they can see real
 * progress instead of just our own "Paid" → "Fulfilled" status label.
 */
export async function getMerchizeOrderProgress(externalNumber: string): Promise<MerchizeOrderProgress | null> {
  const baseUrl = requireEnv("MERCHIZE_API_BASE_URL").replace(/\/+$/, "");
  const token = requireEnv("MERCHIZE_ACCESS_TOKEN");

  const params = new URLSearchParams({ external_number: externalNumber, identifier: MERCHIZE_IDENTIFIER });
  const res = await fetch(`${baseUrl}/order/external/orders/order-progress?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const rawBody = await res.text();
  let body: { success?: boolean; message?: string; data?: MerchizeOrderProgress[] } | null = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = null;
  }

  if (!res.ok || !body || body.success === false) {
    throw new Error(`Merchize order progress lookup failed (${res.status}): ${body?.message ?? rawBody}`);
  }

  return body.data?.[0] ?? null;
}
