import "server-only";
import crypto from "node:crypto";

// Revolut requires every request pinned to a specific API version. Bump this
// deliberately (and re-check the create-order response shape) rather than
// letting it drift — https://developer.revolut.com/docs/guides/accept-payments/versioning/api-versions
const REVOLUT_API_VERSION = "2024-09-01";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

/**
 * Creates a Revolut Merchant order and returns the hosted checkout URL to
 * redirect the customer to. `orderId` (our own orders.id) is round-tripped
 * as merchant_order_ext_ref so the webhook can match a payment back to our
 * order without depending on Revolut's own id field naming.
 */
export async function createRevolutOrder({
  amountCents,
  currency,
  orderId,
  redirectUrl,
}: {
  amountCents: number;
  currency: string;
  orderId: string;
  redirectUrl: string;
}) {
  const baseUrl = requireEnv("REVOLUT_API_BASE_URL");
  const secretKey = requireEnv("REVOLUT_SECRET_KEY");

  const res = await fetch(`${baseUrl}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Revolut-Api-Version": REVOLUT_API_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountCents,
      currency: currency.toUpperCase(),
      capture_mode: "AUTOMATIC",
      merchant_order_ext_ref: orderId,
      redirect_url: redirectUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Revolut order creation failed (${res.status}): ${body}`);
  }

  const data = await res.json();
  if (!data.checkout_url) {
    throw new Error("Revolut order response did not include a checkout_url.");
  }

  return {
    checkoutUrl: data.checkout_url as string,
    revolutOrderId: typeof data.id === "string" ? data.id : null,
  };
}

/**
 * Verifies a Revolut webhook payload actually came from Revolut. Must be
 * called with the *raw* request body — a re-serialized copy of the parsed
 * JSON will not reproduce the same signature.
 * https://developer.revolut.com/docs/guides/merchant/monitor-and-observe/webhooks/verify-the-payload-signature
 */
export function verifyRevolutSignature({
  rawBody,
  signatureHeader,
  timestampHeader,
}: {
  rawBody: string;
  signatureHeader: string | null;
  timestampHeader: string | null;
}) {
  if (!signatureHeader || !timestampHeader) return false;

  const signingSecret = requireEnv("REVOLUT_WEBHOOK_SIGNING_SECRET");

  const timestampMs = Number(timestampHeader);
  if (!Number.isFinite(timestampMs)) return false;
  if (Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) return false;

  const expected = crypto
    .createHmac("sha256", signingSecret)
    .update(`v1.${timestampHeader}.${rawBody}`)
    .digest("hex");

  const provided = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .find((part) => part.startsWith("v1="))
    ?.slice(3);

  if (!provided || provided.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
}
