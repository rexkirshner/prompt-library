/**
 * Public API Rate Limiting
 *
 * IP-based rate limiting for public API endpoints.
 * Limits unauthenticated requests to 100 per hour per IP address.
 *
 * @module lib/api/rate-limit
 */

import { NextRequest } from 'next/server'
import { RateLimiter } from '@/lib/utils/rate-limit'

/**
 * Rate limiter instance for public API endpoints
 * 100 requests per hour per IP address
 */
const publicApiRateLimiter = new RateLimiter({
  maxAttempts: 100,
  windowMs: 3600000, // 1 hour in milliseconds
})

/**
 * Extract client IP address from request headers
 *
 * Checks multiple headers in priority order:
 * 1. x-forwarded-for (set by proxies/load balancers like Vercel)
 * 2. x-real-ip (alternative proxy header)
 * 3. Fallback to 'unknown' (shouldn't happen in production)
 *
 * @param request - Next.js request object
 * @returns IP address string
 *
 * @example
 * const ip = getClientIp(request)
 * // => "192.168.1.1"
 */
export function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For header (most common for proxied requests)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback (shouldn't happen in production)
  return 'unknown'
}

/**
 * Check if request is within rate limit
 *
 * @param request - Next.js request object
 * @returns true if request is allowed, false if rate limited
 *
 * @example
 * if (!checkApiRateLimit(request)) {
 *   return apiRateLimited(getRetryAfter(request))
 * }
 */
export function checkApiRateLimit(request: NextRequest): boolean {
  const ip = getClientIp(request)
  return publicApiRateLimiter.checkLimit(`api:${ip}`)
}

/**
 * Record an API request for rate limiting
 *
 * Call this after successfully serving a request to count it
 * against the rate limit.
 *
 * @param request - Next.js request object
 *
 * @example
 * // After successful response
 * recordApiRequest(request)
 */
export function recordApiRequest(request: NextRequest): void {
  const ip = getClientIp(request)
  publicApiRateLimiter.recordAttempt(`api:${ip}`)
}

/**
 * Get remaining requests for current client
 *
 * @param request - Next.js request object
 * @returns Number of requests remaining before hitting limit
 *
 * @example
 * const remaining = getRemainingRequests(request)
 * // => 95
 */
export function getRemainingRequests(request: NextRequest): number {
  const ip = getClientIp(request)
  return publicApiRateLimiter.getRemainingAttempts(`api:${ip}`)
}

/**
 * Get time until rate limit resets (in seconds)
 *
 * Used for Retry-After header when rate limit is exceeded.
 *
 * @param request - Next.js request object
 * @returns Seconds until the oldest request expires
 *
 * @example
 * const retryAfter = getRetryAfter(request)
 * // => 3420 (57 minutes)
 */
export function getRetryAfter(request: NextRequest): number {
  const ip = getClientIp(request)
  const milliseconds = publicApiRateLimiter.getTimeUntilReset(`api:${ip}`)
  return Math.ceil(milliseconds / 1000)
}
