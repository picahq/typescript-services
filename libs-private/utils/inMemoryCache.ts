const cache = new Map();

export class InMemoryCache {
  set(key: string, value: string) {
    cache.set(key, value);
  }

  get(key: string) {
    return cache.get(key);
  }

  delete(key: string) {
    cache.delete(key);
  }
}
