/**
 * Auth Rate Limiting Tests
 *
 * Tests for authentication rate limiting functionality.
 */

import { RateLimiter } from '@/lib/utils/rate-limit'
import { formatRetryTime } from '../rate-limit'

// Mock the headers function
jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: (name: string) => {
        if (name === 'x-forwarded-for') return '192.168.1.1'
        if (name === 'x-real-ip') return null
        return null
      },
    })
  ),
}))

describe('Auth Rate Limiting', () => {
  describe('formatRetryTime', () => {
    it('formats seconds correctly', () => {
      expect(formatRetryTime(1)).toBe('1 second')
      expect(formatRetryTime(30)).toBe('30 seconds')
      expect(formatRetryTime(59)).toBe('59 seconds')
    })

    it('formats minutes correctly', () => {
      expect(formatRetryTime(60)).toBe('1 minute')
      expect(formatRetryTime(90)).toBe('2 minutes')
      expect(formatRetryTime(120)).toBe('2 minutes')
      expect(formatRetryTime(300)).toBe('5 minutes')
      expect(formatRetryTime(3600)).toBe('60 minutes')
    })
  })

  describe('RateLimiter class', () => {
    let limiter: RateLimiter

    beforeEach(() => {
      limiter = new RateLimiter({
        maxAttempts: 3,
        windowMs: 60000, // 1 minute
      })
    })

    afterEach(() => {
      limiter.stopCleanup()
    })

    it('allows requests under the limit', () => {
      expect(limiter.checkLimit('test-key')).toBe(true)
      limiter.recordAttempt('test-key')
      expect(limiter.checkLimit('test-key')).toBe(true)
      limiter.recordAttempt('test-key')
      expect(limiter.checkLimit('test-key')).toBe(true)
    })

    it('blocks requests over the limit', () => {
      limiter.recordAttempt('test-key')
      limiter.recordAttempt('test-key')
      limiter.recordAttempt('test-key')
      expect(limiter.checkLimit('test-key')).toBe(false)
    })

    it('tracks remaining attempts correctly', () => {
      expect(limiter.getRemainingAttempts('test-key')).toBe(3)
      limiter.recordAttempt('test-key')
      expect(limiter.getRemainingAttempts('test-key')).toBe(2)
      limiter.recordAttempt('test-key')
      expect(limiter.getRemainingAttempts('test-key')).toBe(1)
      limiter.recordAttempt('test-key')
      expect(limiter.getRemainingAttempts('test-key')).toBe(0)
    })

    it('returns time until reset', () => {
      limiter.recordAttempt('test-key')
      const timeUntilReset = limiter.getTimeUntilReset('test-key')
      // Should be close to 60000ms (1 minute)
      expect(timeUntilReset).toBeGreaterThan(59000)
      expect(timeUntilReset).toBeLessThanOrEqual(60000)
    })

    it('resets limits for a key', () => {
      limiter.recordAttempt('test-key')
      limiter.recordAttempt('test-key')
      limiter.recordAttempt('test-key')
      expect(limiter.checkLimit('test-key')).toBe(false)

      limiter.reset('test-key')
      expect(limiter.checkLimit('test-key')).toBe(true)
      expect(limiter.getRemainingAttempts('test-key')).toBe(3)
    })

    it('tracks different keys separately', () => {
      limiter.recordAttempt('key-a')
      limiter.recordAttempt('key-a')
      limiter.recordAttempt('key-a')

      expect(limiter.checkLimit('key-a')).toBe(false)
      expect(limiter.checkLimit('key-b')).toBe(true)
      expect(limiter.getRemainingAttempts('key-b')).toBe(3)
    })

    it('clears all limits', () => {
      limiter.recordAttempt('key-a')
      limiter.recordAttempt('key-b')
      limiter.recordAttempt('key-c')

      limiter.clearAll()

      expect(limiter.getRemainingAttempts('key-a')).toBe(3)
      expect(limiter.getRemainingAttempts('key-b')).toBe(3)
      expect(limiter.getRemainingAttempts('key-c')).toBe(3)
    })
  })

  describe('Integration with auth actions', () => {
    // Note: Full integration tests would require more setup
    // These tests verify the rate limiter works correctly

    let signInLimiter: RateLimiter

    beforeEach(() => {
      signInLimiter = new RateLimiter({
        maxAttempts: 5,
        windowMs: 900000, // 15 minutes
      })
    })

    afterEach(() => {
      signInLimiter.stopCleanup()
    })

    it('blocks after 5 sign-in attempts', () => {
      const ip = '192.168.1.1'
      const key = `signin:${ip}`

      // 5 attempts should succeed
      for (let i = 0; i < 5; i++) {
        expect(signInLimiter.checkLimit(key)).toBe(true)
        signInLimiter.recordAttempt(key)
      }

      // 6th attempt should be blocked
      expect(signInLimiter.checkLimit(key)).toBe(false)
    })
  })

  describe('Sign-up rate limiting', () => {
    let signUpLimiter: RateLimiter

    beforeEach(() => {
      signUpLimiter = new RateLimiter({
        maxAttempts: 3,
        windowMs: 3600000, // 1 hour
      })
    })

    afterEach(() => {
      signUpLimiter.stopCleanup()
    })

    it('blocks after 3 sign-up attempts', () => {
      const ip = '192.168.1.1'
      const key = `signup:${ip}`

      // 3 attempts should succeed
      for (let i = 0; i < 3; i++) {
        expect(signUpLimiter.checkLimit(key)).toBe(true)
        signUpLimiter.recordAttempt(key)
      }

      // 4th attempt should be blocked
      expect(signUpLimiter.checkLimit(key)).toBe(false)
    })
  })
})
