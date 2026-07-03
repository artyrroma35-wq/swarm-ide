/**
 * 🛡️ Rate Limiter
 * Защита от спама и перегрузок
 */

export class RateLimiter {
  private buckets = new Map<string, { tokens: number; lastRefill: number }>();
  private maxTokens: number;
  private refillRate: number; // tokens per second
  private refillInterval: number;

  constructor(maxTokens: number = 30, refillInterval: number = 60000) {
    this.maxTokens = maxTokens;
    this.refillRate = maxTokens / (refillInterval / 1000);
    this.refillInterval = refillInterval;
  }

  check(key: string): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    
    if (!bucket) {
      bucket = { tokens: this.maxTokens - 1, lastRefill: now };
      this.buckets.set(key, bucket);
      return true;
    }

    // Refill tokens
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.maxTokens, bucket.tokens + elapsed * this.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      return false; // Rate limited
    }

    bucket.tokens -= 1;
    return true;
  }

  getRemaining(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return this.maxTokens;
    const elapsed = (Date.now() - bucket.lastRefill) / 1000;
    return Math.floor(Math.min(this.maxTokens, bucket.tokens + elapsed * this.refillRate));
  }

  getResetTime(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket) return 0;
    const tokensNeeded = this.maxTokens - bucket.tokens;
    return Math.ceil(tokensNeeded / this.refillRate) * 1000;
  }
}

export const apiLimiter = new RateLimiter(60, 60000); // 60 запросов в минуту
export const authLimiter = new RateLimiter(5, 60000);  // 5 попыток входа в минуту
