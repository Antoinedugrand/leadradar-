const WINDOW_MS = 1000;
const MAX_CALLS = 10;

const buckets = new Map<string, number[]>();

export function enforceRateLimit(key: string): boolean {
  const now = Date.now();
  const calls = buckets.get(key) ?? [];
  const recentCalls = calls.filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recentCalls.length >= MAX_CALLS) {
    buckets.set(key, recentCalls);
    return false;
  }

  recentCalls.push(now);
  buckets.set(key, recentCalls);
  return true;
}
