/** Minimal in-memory fixed-window rate limiter for auth endpoints (gate PIN,
 * owner login) that had none before — unlimited attempts meant a 6-char PIN
 * or a password was brute-forceable with a plain script.
 *
 * Honest limitation: this state lives in the Node process's memory, so on a
 * serverless platform (Vercel) with multiple concurrent instances it's a
 * best-effort per-instance limit, not a hard global cap — an attacker who
 * fans out across instances can exceed it. It still stops the common case
 * (a single script hammering one endpoint) and is a real improvement over
 * no limit at all. For a hard guarantee, move the counters to a shared store
 * (e.g. Upstash Redis) — swap the Map below for that store without changing
 * the call sites.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Periodic cleanup so the Map doesn't grow unbounded over a long-lived process.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Returns { allowed: false } once `limit` attempts have been recorded for
 * `key` within `windowSeconds`. Every call (allowed or not) counts as an
 * attempt — call this once per request, not once per success. */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  existing.count += 1;
  if (existing.count > limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Best-effort client identifier from standard proxy headers (Vercel sets
 * x-forwarded-for). Falls back to a constant so requests with no header at
 * all still share one bucket instead of bypassing the limit entirely. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "unknown";
}
