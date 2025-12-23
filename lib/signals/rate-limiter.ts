import Redis from 'ioredis';

/**
 * Production-grade rate limiter using Redis
 * Prevents API abuse and respects rate limits
 */
export class RateLimiter {
  private redis: Redis;
  private defaultLimit: number;
  private defaultWindow: number; // in seconds

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    this.defaultLimit = 100; // 100 requests
    this.defaultWindow = 60; // per minute
  }

  /**
   * Check if request is allowed within rate limit
   * @param key - Unique identifier for the rate limit (e.g., 'serpapi:linkedin')
   * @param limit - Maximum number of requests
   * @param window - Time window in seconds
   * @returns true if allowed, false if rate limited
   */
  async checkLimit(
    key: string,
    limit: number = this.defaultLimit,
    window: number = this.defaultWindow
  ): Promise<boolean> {
    const redisKey = `ratelimit:${key}`;
    const current = await this.redis.incr(redisKey);

    if (current === 1) {
      // First request, set expiration
      await this.redis.expire(redisKey, window);
    }

    return current <= limit;
  }

  /**
   * Get remaining requests in current window
   */
  async getRemaining(key: string, limit: number = this.defaultLimit): Promise<number> {
    const redisKey = `ratelimit:${key}`;
    const current = await this.redis.get(redisKey);
    const count = current ? parseInt(current) : 0;
    return Math.max(0, limit - count);
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string): Promise<void> {
    const redisKey = `ratelimit:${key}`;
    await this.redis.del(redisKey);
  }

  /**
   * Wait until rate limit allows request
   */
  async waitForLimit(
    key: string,
    limit: number = this.defaultLimit,
    window: number = this.defaultWindow
  ): Promise<void> {
    while (!(await this.checkLimit(key, limit, window))) {
      const remaining = await this.getRemaining(key, limit);
      if (remaining === 0) {
        // Wait for window to reset
        await new Promise(resolve => setTimeout(resolve, window * 1000));
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
}




