import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import { checkoutSignatureOk as verifyCheckoutSignature, webhookSignatureOk as verifyWebhookSignature } from '../src/utils/razorpaySignature.js';

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

test('checkout signature: valid, tampered, wrong secret, missing', () => {
  const secret = 'rzp_secret_123';
  const sig = hmac(secret, 'order_A|pay_B');
  assert.equal(verifyCheckoutSignature({ orderId: 'order_A', paymentId: 'pay_B', signature: sig }, secret), true);
  assert.equal(verifyCheckoutSignature({ orderId: 'order_A', paymentId: 'pay_X', signature: sig }, secret), false);
  assert.equal(verifyCheckoutSignature({ orderId: 'order_A', paymentId: 'pay_B', signature: sig }, 'other'), false);
  assert.equal(verifyCheckoutSignature({ orderId: 'order_A', paymentId: 'pay_B', signature: 'abc' }, secret), false);
  assert.equal(verifyCheckoutSignature({ orderId: 'order_A', paymentId: 'pay_B', signature: '' }, secret), false);
});

test('webhook signature is checked against the raw body bytes', () => {
  const secret = 'whsec';
  const body = Buffer.from('{"event":"payment.captured"}');
  const sig = hmac(secret, body);
  assert.equal(verifyWebhookSignature(body, sig, secret), true);
  assert.equal(verifyWebhookSignature(Buffer.from('{"event":"payment.captured" }'), sig, secret), false);
  assert.equal(verifyWebhookSignature(body, undefined, secret), false);
});
