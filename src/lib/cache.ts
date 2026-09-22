type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

/**
 * Minimal in-process TTL cache. The technical plan calls for Redis in
 * production; for the lean MVP a per-instance map is enough to implement the
 * stale-while-revalidate behaviour described in the plan without extra infra.
 */
export function getCached<T>(key: string): T | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.expires) return undefined;
  return hit.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}

/** Returns the last cached value regardless of TTL (used as a stale fallback). */
export function getStale<T>(key: string): T | undefined {
  const hit = store.get(key);
  return hit ? (hit.value as T) : undefined;
}

export async function withCache<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<{ value: T; stale: boolean }> {
  const fresh = getCached<T>(key);
  if (fresh !== undefined) return { value: fresh, stale: false };
  try {
    const value = await loader();
    setCached(key, value, ttlMs);
    return { value, stale: false };
  } catch (err) {
    const stale = getStale<T>(key);
    if (stale !== undefined) return { value: stale, stale: true };
    throw err;
  }
}

export async function fetchJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "nepal-realtime-dashboard/0.1 (+https://github.com)" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Upstream ${url} responded ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}
