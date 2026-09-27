import assert from 'node:assert/strict';
import test from 'node:test';
import { BOOKING_STATUS, BOOKING_TRANSITIONS } from '../src/constants.js';
import { assertTransition } from '../src/services/transitions.js';
import { detectServiceType } from '../src/services/geo.service.js';
import { isString, normalizeEmail, normalizePhone, validatePassword } from '../src/utils/validators.js';

const p = (latitude, longitude) => ({ latitude, longitude });

test('service type is decided by coordinates (Airport > Local > Outstation)', () => {
  const rajwada = p(22.7196, 75.8577); // Indore centre
  const vijayNagar = p(22.7533, 75.8937); // Indore
  const airport = p(22.7218, 75.8011); // Indore airport
  const bhopal = p(23.2599, 77.4126);
  assert.equal(detectServiceType(rajwada, vijayNagar), 'local');
  assert.equal(detectServiceType(rajwada, airport), 'airport');
  assert.equal(detectServiceType(airport, bhopal), 'airport');
  assert.equal(detectServiceType(rajwada, bhopal), 'outstation');
  assert.equal(detectServiceType(bhopal, p(23.18, 77.4)), 'outstation'); // both outside Indore
});

test('booking status can only move along allowed paths', () => {
  const S = BOOKING_STATUS;
  assert.doesNotThrow(() => assertTransition(S.PENDING, S.CONFIRMED));
  assert.doesNotThrow(() => assertTransition(S.CONFIRMED, S.DRIVER_ASSIGNED));
  assert.doesNotThrow(() => assertTransition(S.TRIP_STARTED, S.COMPLETED));
  assert.throws(() => assertTransition(S.PENDING, S.COMPLETED));
  assert.throws(() => assertTransition(S.PENDING, S.DRIVER_ASSIGNED));
  assert.throws(() => assertTransition(S.COMPLETED, S.CANCELLED));
  assert.throws(() => assertTransition(S.REJECTED, S.CONFIRMED));
  assert.throws(() => assertTransition(S.TRIP_STARTED, S.CANCELLED));
  // every status is defined in the transition table
  for (const s of Object.values(S)) assert.ok(s in BOOKING_TRANSITIONS, s);
});

test('validators reject injection objects and bad values', () => {
  assert.equal(normalizePhone('+91 98765 43210'), '9876543210');
  assert.equal(normalizePhone('12345'), null);
  assert.equal(normalizePhone('5876543210'), null); // Indian mobiles start with 6-9
  assert.equal(normalizePhone({ $gt: '' }), null);
  assert.equal(normalizeEmail({ $gt: '' }), null);
  assert.equal(normalizeEmail(' Test@Example.com '), 'test@example.com');
  assert.equal(normalizeEmail('not-an-email'), null);
  assert.equal(isString({ $ne: null }), false);
  assert.equal(validatePassword('short'), false);
  assert.equal(validatePassword('long-enough-1'), true);
  assert.equal(validatePassword('x'.repeat(73)), false);
});
