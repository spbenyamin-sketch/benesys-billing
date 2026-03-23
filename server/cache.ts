/**
 * Lightweight in-memory TTL cache.
 * Avoids Redis dependency while still preventing repeated expensive DB queries
 * (dashboard metrics, outstanding report) on every page load.
 *
 * Usage:
 *   appCache.get<T>(key)          — returns cached value or undefined
 *   appCache.set(key, value, ttl) — store with TTL in milliseconds
 *   appCache.del(key)             — invalidate a single key
 *   appCache.delPrefix(prefix)    — invalidate all keys matching prefix
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  del(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys that start with the given prefix */
  delPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export const appCache = new MemoryCache();

// TTL constants
export const TTL = {
  DASHBOARD: 60_000,     // 60 s  — metrics refresh every minute
  OUTSTANDING: 30_000,   // 30 s  — outstanding balances refresh every 30 s
} as const;
