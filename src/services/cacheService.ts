interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheItem<any>>;
  private readonly DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

  private constructor() {
    this.cache = new Map();
    this.loadFromStorage();
    window.addEventListener('beforeunload', () => this.saveToStorage());
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  private generateKey(key: string, params?: Record<string, any>): string {
    if (!params) return key;
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, curr) => {
        acc[curr] = params[curr];
        return acc;
      }, {} as Record<string, any>);
    return `${key}:${JSON.stringify(sortedParams)}`;
  }

  private loadFromStorage(): void {
    try {
      const savedCache = localStorage.getItem('moe_cache');
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Error loading cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const cacheObj = Object.fromEntries(this.cache.entries());
      localStorage.setItem('moe_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.warn('Error saving cache to storage:', error);
    }
  }

  public set<T>(
    key: string,
    data: T,
    params?: Record<string, any>,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const cacheKey = this.generateKey(key, params);
    const timestamp = Date.now();
    const expiresAt = timestamp + ttl;

    this.cache.set(cacheKey, {
      data,
      timestamp,
      expiresAt,
    });
  }

  public get<T>(key: string, params?: Record<string, any>): T | null {
    const cacheKey = this.generateKey(key, params);
    const item = this.cache.get(cacheKey);

    if (!item) return null;

    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(cacheKey);
      return null;
    }

    return item.data as T;
  }

  public invalidate(key: string, params?: Record<string, any>): void {
    const cacheKey = this.generateKey(key, params);
    this.cache.delete(cacheKey);
  }

  public invalidateAll(): void {
    this.cache.clear();
  }

  public getAnalysisResults(domain: string) {
    return this.get<any>(`analysis:${domain}`);
  }

  public setAnalysisResults(domain: string, results: any) {
    this.set(`analysis:${domain}`, results);
  }

  public getOpportunities(domain: string) {
    return this.get<any>(`opportunities:${domain}`);
  }

  public setOpportunities(domain: string, opportunities: any) {
    this.set(`opportunities:${domain}`, opportunities);
  }

  public getDomainOverview(domain: string) {
    return this.get<any>(`overview:${domain}`);
  }

  public setDomainOverview(domain: string, overview: any) {
    this.set(`overview:${domain}`, overview);
  }

  public getRecentSearches(): string[] {
    return this.get<string[]>('recent_searches') || [];
  }

  public addRecentSearch(domain: string) {
    const searches = this.getRecentSearches();
    const updatedSearches = [domain, ...searches.filter(d => d !== domain)].slice(0, 10);
    this.set('recent_searches', updatedSearches);
  }
}

export const cacheService = CacheService.getInstance();
