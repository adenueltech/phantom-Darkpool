/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting to protect API endpoints from abuse:
 * - Per-IP rate limiting
 * - Per-endpoint rate limiting
 * - Sliding window algorithm
 * - Configurable limits
 * 
 * Requirements: 9.3, 17.3
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
  requests: number[];
}

/**
 * Rate Limiter
 * Implements sliding window rate limiting
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    this.config = {
      message: 'Too many requests, please try again later',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Create rate limiting middleware
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const key = this.getKey(req);
      const now = Date.now();

      // Get or create rate limit entry
      let entry = this.limits.get(key);
      if (!entry) {
        entry = {
          count: 0,
          resetTime: now + this.config.windowMs,
          requests: [],
        };
        this.limits.set(key, entry);
      }

      // Clean old requests (sliding window)
      entry.requests = entry.requests.filter(
        timestamp => timestamp > now - this.config.windowMs
      );

      // Check if limit exceeded
      if (entry.requests.length >= this.config.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        
        res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
        res.setHeader('X-RateLimit-Remaining', '0');
        res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
        res.setHeader('Retry-After', retryAfter.toString());

        return res.status(429).json({
          error: 'Rate limit exceeded',
          message: this.config.message,
          retryAfter,
        });
      }

      // Add current request
      entry.requests.push(now);
      entry.count++;

      // Update reset time if needed
      if (now >= entry.resetTime) {
        entry.resetTime = now + this.config.windowMs;
      }

      // Set rate limit headers
      const remaining = this.config.maxRequests - entry.requests.length;
      res.setHeader('X-RateLimit-Limit', this.config.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', remaining.toString());
      res.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

      // Handle response to potentially skip counting
      if (this.config.skipSuccessfulRequests || this.config.skipFailedRequests) {
        const originalSend = res.send;
        res.send = function (data: any) {
          const statusCode = res.statusCode;
          
          // Remove request from count if needed
          if (
            (this.config.skipSuccessfulRequests && statusCode < 400) ||
            (this.config.skipFailedRequests && statusCode >= 400)
          ) {
            entry!.requests.pop();
          }
          
          return originalSend.call(this, data);
        }.bind(this);
      }

      next();
    };
  }

  /**
   * Get rate limit key from request
   * Uses IP address by default
   */
  private getKey(req: Request): string {
    // Try to get real IP from headers (for proxies)
    const ip = 
      req.headers['x-forwarded-for'] ||
      req.headers['x-real-ip'] ||
      req.socket.remoteAddress ||
      'unknown';

    return Array.isArray(ip) ? ip[0] : ip.toString();
  }

  /**
   * Start cleanup interval to remove old entries
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      
      for (const [key, entry] of this.limits.entries()) {
        // Remove entries that are past their reset time and have no recent requests
        if (entry.resetTime < now && entry.requests.length === 0) {
          this.limits.delete(key);
        }
      }
    }, this.config.windowMs);
  }

  /**
   * Stop cleanup interval
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Reset all rate limits
   */
  resetAll(): void {
    this.limits.clear();
  }

  /**
   * Get current rate limit status for a key
   */
  getStatus(key: string): {
    requests: number;
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.limits.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();
    const requests = entry.requests.filter(
      timestamp => timestamp > now - this.config.windowMs
    ).length;

    return {
      requests,
      remaining: this.config.maxRequests - requests,
      resetTime: entry.resetTime,
    };
  }
}

/**
 * Create rate limiter with default config
 */
export function createRateLimiter(config: Partial<RateLimitConfig> = {}): RateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    ...config,
  };

  return new RateLimiter(defaultConfig);
}

/**
 * Predefined rate limiters for different endpoint types
 */
export const rateLimiters = {
  // Strict rate limit for order submission (prevent spam)
  orderSubmission: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 orders per minute
    message: 'Too many order submissions, please slow down',
  }),

  // Moderate rate limit for queries
  queries: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 100, // 100 queries per minute
  }),

  // Strict rate limit for withdrawals
  withdrawals: createRateLimiter({
    windowMs: 300000, // 5 minutes
    maxRequests: 5, // 5 withdrawals per 5 minutes
    message: 'Too many withdrawal requests, please wait',
  }),

  // Very strict rate limit for proof generation requests
  proofGeneration: createRateLimiter({
    windowMs: 60000, // 1 minute
    maxRequests: 20, // 20 proof requests per minute
    message: 'Too many proof generation requests',
  }),
};
