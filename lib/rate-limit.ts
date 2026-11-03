type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max = 6, windowMs = 60_000) {
  const now = Date.now(); const item = buckets.get(key);
  if (!item || item.resetAt <= now) { buckets.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, retryAfter: 0 }; }
  item.count += 1;
  return { allowed: item.count <= max, retryAfter: Math.ceil((item.resetAt - now) / 1000) };
}
