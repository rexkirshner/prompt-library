/**
 * Rate Limiting Utilities
 *
 * Simple in-memory rate limiting implementation using sliding window.
 * For production with multiple servers, consider Redis-based rate limiting
 * (e.g., @upstash/ratelimit).
 *
 * @security
 * This module helps prevent brute force attacks and abuse by limiting the
 * number of attempts for sensitive operations within a time window.
 */

/**
 * Represents a single attempt timestamp
 */
interface RateLimitAttempt {
  timestamp: number
}

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /**
   * Maximum number of attempts allowed within the window
   * @default 5
   */
  maxAttempts: number

  /**
   * Time window in milliseconds
   * @default 3600000 (1 hour)
   */
  windowMs: number

  /**
   * How often to clean up expired entries (in milliseconds)
   * @default 300000 (5 minutes)
   */
  cleanupIntervalMs?: number
}

/**
 * In-memory rate limiter using sliding window algorithm
 *
 * @example
 * ```typescript
 * const limiter = new RateLimiter({
 *   maxAttempts: 5,
 *   windowMs: 3600000 // 1 hour
 * })
 *
 * // Check if user can make an attempt
 * if (!limiter.checkLimit('user-123')) {
 *   throw new Error('Too many attempts. Please try again later.')
 * }
 *
 * // Record successful attempt
 * limiter.recordAttempt('user-123')
 * ```
 */
export class RateLimiter {
  private attempts: Map<string, RateLimitAttempt[]>
  private config: Required<RateLimitConfig>
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor(config: RateLimitConfig) {
    this.attempts = new Map()
    this.config = {
      maxAttempts: config.maxAttempts,
      windowMs: config.windowMs,
      cleanupIntervalMs: config.cleanupIntervalMs || 300000, // 5 minutes default
    }

    // Start periodic cleanup
    this.startCleanup()
  }

  /**
   * Start periodic cleanup of expired entries
   * @private
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupIntervalMs)

    // Don't prevent Node from exiting
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  /**
   * Stop periodic cleanup (for testing or cleanup)
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Remove expired attempts from memory
   * @private
   */
  private cleanup(): void {
    const now = Date.now()
    const cutoff = now - this.config.windowMs

    for (const [key, attempts] of this.attempts.entries()) {
      // Filter out expired attempts
      const validAttempts = attempts.filter((a) => a.timestamp > cutoff)

      if (validAttempts.length === 0) {
        // Remove entry if no valid attempts remain
        this.attempts.delete(key)
      } else if (validAttempts.length !== attempts.length) {
        // Update with filtered attempts
        this.attempts.set(key, validAttempts)
      }
    }
  }

  /**
   * Get recent attempts for a key within the time window
   * @private
   */
  private getRecentAttempts(key: string): RateLimitAttempt[] {
    const attempts = this.attempts.get(key) || []
    const now = Date.now()
    const cutoff = now - this.config.windowMs

    // Filter to only recent attempts
    return attempts.filter((a) => a.timestamp > cutoff)
  }

  /**
   * Check if a key has exceeded the rate limit
   *
   * @param key - Unique identifier (e.g., user ID, IP address)
   * @returns true if within limit, false if limit exceeded
   *
   * @example
   * ```typescript
   * if (!limiter.checkLimit('user-123')) {
   *   return { error: 'Too many attempts. Try again in 1 hour.' }
   * }
   * ```
   */
  public checkLimit(key: string): boolean {
    const recentAttempts = this.getRecentAttempts(key)
    return recentAttempts.length < this.config.maxAttempts
  }

  /**
   * Record an attempt for a key
   *
   * @param key - Unique identifier (e.g., user ID, IP address)
   *
   * @example
   * ```typescript
   * // After validating the attempt is allowed
   * if (limiter.checkLimit('user-123')) {
   *   limiter.recordAttempt('user-123')
   *   // ... proceed with operation
   * }
   * ```
   */
  public recordAttempt(key: string): void {
    const attempts = this.attempts.get(key) || []
    attempts.push({ timestamp: Date.now() })
    this.attempts.set(key, attempts)
  }

  /**
   * Get remaining attempts for a key
   *
   * @param key - Unique identifier
   * @returns Number of attempts remaining before hitting the limit
   *
   * @example
   * ```typescript
   * const remaining = limiter.getRemainingAttempts('user-123')
   * console.log(`You have ${remaining} attempts remaining`)
   * ```
   */
  public getRemainingAttempts(key: string): number {
    const recentAttempts = this.getRecentAttempts(key)
    return Math.max(0, this.config.maxAttempts - recentAttempts.length)
  }

  /**
   * Get time until the oldest attempt expires (in milliseconds)
   *
   * @param key - Unique identifier
   * @returns Time in milliseconds until the limit resets, or 0 if no attempts
   *
   * @example
   * ```typescript
   * const resetTime = limiter.getTimeUntilReset('user-123')
   * const minutes = Math.ceil(resetTime / 60000)
   * console.log(`Try again in ${minutes} minutes`)
   * ```
   */
  public getTimeUntilReset(key: string): number {
    const attempts = this.getRecentAttempts(key)
    if (attempts.length === 0) {
      return 0
    }

    const oldestAttempt = attempts[0]
    const expiresAt = oldestAttempt.timestamp + this.config.windowMs
    const now = Date.now()

    return Math.max(0, expiresAt - now)
  }

  /**
   * Reset all attempts for a key (for testing or manual reset)
   *
   * @param key - Unique identifier to reset
   *
   * @example
   * ```typescript
   * // Reset attempts for a user (e.g., after admin intervention)
   * limiter.reset('user-123')
   * ```
   */
  public reset(key: string): void {
    this.attempts.delete(key)
  }

  /**
   * Clear all rate limit data (for testing)
   */
  public clearAll(): void {
    this.attempts.clear()
  }
}

/**
 * Password change rate limiter singleton
 * Limits to 5 attempts per hour per user
 */
export const passwordChangeRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 3600000, // 1 hour
})
