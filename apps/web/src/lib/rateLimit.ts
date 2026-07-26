// In-memory fixed-window rate limiter — deliberately not backed by a store.
// The architecture (CLAUDE.md) runs a single Next.js app container, so a
// process-local Map is enough to stop scripted brute force; it resets on
// deploy/restart and won't coordinate across replicas if this ever scales
// horizontally — acceptable for the current single-instance deployment, but
// revisit with a shared store (DB table/Redis) before running more than one
// instance.
const attempts = new Map<string, { count: number; resetAt: number }>();

// Safety valve so an attacker can't grow this map unbounded by cycling keys
// (e.g. many distinct phone numbers) — worst case we just reset early.
const MAX_TRACKED_KEYS = 10_000;

export function checkRateLimit(
  key: string,
  { maxAttempts, windowMs }: { maxAttempts: number; windowMs: number },
): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt <= now) {
    if (attempts.size >= MAX_TRACKED_KEYS) attempts.clear();
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= maxAttempts) return false;

  entry.count += 1;
  return true;
}
