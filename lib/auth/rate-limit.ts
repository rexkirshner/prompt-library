/**
 * Authentication Rate Limiting
 *
 * IP-based rate limiting for authentication endpoints.
 * Protects against brute force attacks and credential stuffing.
 *
 * @module lib/auth/rate-limit
 * @security Rate limiting is essential for preventing unauthorized access attempts.
 */

import { headers } from 'next/headers'
import { RateLimiter } from '@/lib/utils/rate-limit'

/**
 * Rate limiter for sign-in attempts
 * 5 attempts per 15 minutes per IP (fairly aggressive)
 */
const signInRateLimiter = new RateLimiter({
  maxAttempts: 5,
  windowMs: 900000, // 15 minutes
})

/**
 * Rate limiter for sign-up attempts
 * 3 attempts per hour per IP (prevent spam accounts)
 */
const signUpRateLimiter = new RateLimiter({
  maxAttempts: 3,
  windowMs: 3600000, // 1 hour
})

/**
 * Extract client IP address from request headers in server actions
 *
 * Checks multiple headers in priority order:
 * 1. x-forwarded-for (set by proxies/load balancers like Vercel)
 * 2. x-real-ip (alternative proxy header)
 * 3. Fallback to 'unknown' (shouldn't happen in production)
 *
 * @returns IP address string
 *
 * @example
 * const ip = await getClientIpFromHeaders()
 * // => "192.168.1.1"
 */
export async function getClientIpFromHeaders(): Promise<string> {
  const headersList = await headers()

  // Check X-Forwarded-For header (most common for proxied requests)
  const forwardedFor = headersList.get('x-forwarded-for')
  if (forwardedFor) {
    // Take the first IP in the chain (original client)
    return forwardedFor.split(',')[0].trim()
  }

  // Check X-Real-IP header (alternative proxy header)
  const realIp = headersList.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  // Fallback (shouldn't happen in production)
  return 'unknown'
}

/**
 * Rate limit result with details for user feedback
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

/**
 * Check sign-in rate limit for current request
 *
 * @returns Rate limit check result
 *
 * @example
 * const result = await checkSignInRateLimit()
 * if (!result.allowed) {
 *   return { error: `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.` }
 * }
 */
export async function checkSignInRateLimit(): Promise<RateLimitResult> {
  const ip = await getClientIpFromHeaders()
  const key = `signin:${ip}`

  const allowed = signInRateLimiter.checkLimit(key)
  const remaining = signInRateLimiter.getRemainingAttempts(key)
  const retryAfterMs = signInRateLimiter.getTimeUntilReset(key)

  return {
    allowed,
    remaining,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  }
}

/**
 * Record a sign-in attempt for rate limiting
 *
 * Call this BEFORE validating credentials to count failed attempts.
 *
 * @example
 * await recordSignInAttempt()
 * // Now validate credentials...
 */
export async function recordSignInAttempt(): Promise<void> {
  const ip = await getClientIpFromHeaders()
  const key = `signin:${ip}`
  signInRateLimiter.recordAttempt(key)
}

/**
 * Check sign-up rate limit for current request
 *
 * @returns Rate limit check result
 *
 * @example
 * const result = await checkSignUpRateLimit()
 * if (!result.allowed) {
 *   return { error: 'Too many sign-up attempts.' }
 * }
 */
export async function checkSignUpRateLimit(): Promise<RateLimitResult> {
  const ip = await getClientIpFromHeaders()
  const key = `signup:${ip}`

  const allowed = signUpRateLimiter.checkLimit(key)
  const remaining = signUpRateLimiter.getRemainingAttempts(key)
  const retryAfterMs = signUpRateLimiter.getTimeUntilReset(key)

  return {
    allowed,
    remaining,
    retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
  }
}

/**
 * Record a sign-up attempt for rate limiting
 *
 * Call this BEFORE processing sign-up to count all attempts.
 *
 * @example
 * await recordSignUpAttempt()
 * // Now process sign-up...
 */
export async function recordSignUpAttempt(): Promise<void> {
  const ip = await getClientIpFromHeaders()
  const key = `signup:${ip}`
  signUpRateLimiter.recordAttempt(key)
}

/**
 * Reset sign-in rate limit for an IP (for testing)
 */
export async function resetSignInRateLimit(): Promise<void> {
  const ip = await getClientIpFromHeaders()
  const key = `signin:${ip}`
  signInRateLimiter.reset(key)
}

/**
 * Reset sign-up rate limit for an IP (for testing)
 */
export async function resetSignUpRateLimit(): Promise<void> {
  const ip = await getClientIpFromHeaders()
  const key = `signup:${ip}`
  signUpRateLimiter.reset(key)
}

/**
 * Format retry time for user-friendly messages
 */
export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`
  }
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
