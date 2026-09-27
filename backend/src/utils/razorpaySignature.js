import crypto from 'node:crypto';

// PURE signature checks (no env, no network) so they can be unit tested.
function safeEqual(a, b) {
  const x = Buffer.from(String(a), 'utf8');
  const y = Buffer.from(String(b), 'utf8');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Checkout signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret)
export function checkoutSignatureOk({ orderId, paymentId, signature }, secret) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  return safeEqual(crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex'), signature);
}

// Webhook signature = HMAC_SHA256(raw request body, webhook_secret)
export function webhookSignatureOk(rawBody, signature, secret) {
  if (!rawBody || !signature || !secret) return false;
  return safeEqual(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), signature);
}
