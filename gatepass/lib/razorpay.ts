import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

// ──────────────────────────────────────────────
// Create a Razorpay order for a registration
// amount: in paise
// ──────────────────────────────────────────────
export async function createRazorpayOrder(params: {
  amount: number;       // paise
  currency?: string;
  receipt: string;      // registration id
  notes?: Record<string, string>;
}) {
  const body = {
    amount: params.amount,
    currency: params.currency ?? "INR",
    receipt: params.receipt,
    notes: params.notes ?? {},
  };

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64"),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Razorpay order creation failed: ${error.error?.description}`);
  }

  return response.json() as Promise<{
    id: string;
    amount: number;
    currency: string;
    receipt: string;
    status: string;
  }>;
}

// ──────────────────────────────────────────────
// Verify Razorpay webhook signature
// Must be called with the raw request body (not parsed)
// ──────────────────────────────────────────────
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(signature, "hex")
  );
}

// ──────────────────────────────────────────────
// Verify payment signature after client-side payment
// ──────────────────────────────────────────────
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const payload = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(payload)
    .digest("hex");
  return expectedSignature === params.razorpay_signature;
}

export const razorpayKeyId = RAZORPAY_KEY_ID;
