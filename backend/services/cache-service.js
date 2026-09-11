class CacheService {
  constructor() {
    this.leadsCache = { data: null, timestamp: 0 };
    this.activeFetchPromise = null;
  }

  getLeadsCache() {
    return this.leadsCache;
  }

  setLeadsCache(data) {
    this.leadsCache = { data, timestamp: Date.now() };
  }

  invalidateLeadsCache() {
    this.leadsCache = { data: null, timestamp: 0 };
    console.log('🔄 Cache invalidated.');
  }

  getActiveFetchPromise() {
    return this.activeFetchPromise;
  }

  setActiveFetchPromise(promise) {
    this.activeFetchPromise = promise;
  }
}

export default new CacheService();
