const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour time-to-live

export const getCache = (key) => {
  if (cache.has(key)) {
    const { data, timestamp } = cache.get(key);
    // Return data if the cache hasn't expired
    if (Date.now() - timestamp < CACHE_TTL) {
      return data;
    }
    // Expired cache, remove it
    cache.delete(key);
  }
  return null;
};

export const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

export const clearCache = (prefix = '') => {
  if (!prefix) {
    cache.clear();
    return;
  }
  // Clear all keys that start with the given prefix
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};