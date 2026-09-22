type CacheEntry<T> = { expires: number; value: T };

const store = new Map<string, CacheEntry<unknown>>();

export function getCached<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expires) {
    store.delete(key);
    return null;
  }
  return hit.value as T;
}

export function setCached<T>(key: string, value: T, ttlMs: number): T {
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const existing = getCached<T>(key);
  if (existing !== null) return existing;
  const value = await loader();
  return setCached(key, value, ttlMs);
}
