import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { checkoutSignatureOk, webhookSignatureOk } from '../utils/razorpaySignature.js';

const API = 'https://api.razorpay.com/v1';

export const razorpayConfigured = () => Boolean(env.razorpay.keyId && env.razorpay.keySecret);

/* ---------- PURE signature helpers (unit tested in tests/razorpay.test.js) ---------- */

export const verifyCheckoutSignature = (parts, secret = env.razorpay.keySecret) => checkoutSignatureOk(parts, secret);
export const verifyWebhookSignature = (rawBody, signature, secret = env.razorpay.webhookSecret) =>
  webhookSignatureOk(rawBody, signature, secret);

/* ---------- REST calls (plain fetch, no SDK needed) ---------- */

async function call(method, path, body) {
  if (!razorpayConfigured()) throw new ApiError(503, 'Online payment is not configured yet.');
  const auth = Buffer.from(`${env.razorpay.keyId}:${env.razorpay.keySecret}`).toString('base64');
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(503, 'Payment gateway is not reachable. Please try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('Razorpay error:', res.status, JSON.stringify(data));
    throw new ApiError(502, data?.error?.description || 'Payment gateway error.');
  }
  return data;
}

// amountPaise = whole paise (rupees x 100)
export const createOrder = ({ amountPaise, receipt, notes }) =>
  call('POST', '/orders', { amount: amountPaise, currency: 'INR', receipt, notes });

export const fetchPayment = (paymentId) => call('GET', `/payments/${encodeURIComponent(paymentId)}`);

export const capturePayment = (paymentId, amountPaise) =>
  call('POST', `/payments/${encodeURIComponent(paymentId)}/capture`, { amount: amountPaise, currency: 'INR' });

export const refundPayment = (paymentId, amountPaise, notes) =>
  call('POST', `/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, notes });
