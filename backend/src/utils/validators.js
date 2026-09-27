// Every validator checks typeof === 'string' first. This also blocks
// NoSQL-injection payloads like { "email": { "$gt": "" } }.
export const isString = (v) => typeof v === 'string';

export function normalizePhone(value) {
  if (!isString(value)) return null;
  const last10 = value.replace(/\D/g, '').slice(-10);
  return /^[6-9]\d{9}$/.test(last10) ? last10 : null;
}

export function normalizeEmail(value) {
  if (!isString(value)) return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

export const validateName = (v) => isString(v) && v.trim().length >= 2 && v.trim().length <= 80;

// bcrypt only uses the first 72 characters, so 72 is the sensible maximum.
export const validatePassword = (v) => isString(v) && v.length >= 8 && v.length <= 72;
