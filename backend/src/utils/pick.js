// Small helpers so controllers only ever copy fields they explicitly allow
// (protects against "mass assignment", e.g. someone sending role: "admin").
export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function parsePage(query, defaultLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}
