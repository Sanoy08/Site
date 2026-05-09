// src/lib/rate-limit.ts
const trackers = new Map<string, { count: number; expiresAt: number }>();

export function rateLimit(ip: string, limit: number = 5, windowMs: number = 60000) {
  const now = Date.now();
  const record = trackers.get(ip);

  if (!record) {
    trackers.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (now > record.expiresAt) {
    trackers.set(ip, { count: 1, expiresAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false; // লিমিট শেষ
  }

  record.count++;
  return true;
}