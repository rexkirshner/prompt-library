import { RateLimiter } from '../rate-limit'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    // Create a fresh limiter for each test
    limiter = new RateLimiter({
      maxAttempts: 3,
      windowMs: 1000, // 1 second for faster tests
      cleanupIntervalMs: 10000, // Don't cleanup during tests
    })
  })

  afterEach(() => {
    // Stop cleanup interval
    limiter.stopCleanup()
  })

  describe('checkLimit', () => {
    it('allows attempts under the limit', () => {
      expect(limiter.checkLimit('user-1')).toBe(true)
      limiter.recordAttempt('user-1')

      expect(limiter.checkLimit('user-1')).toBe(true)
      limiter.recordAttempt('user-1')

      expect(limiter.checkLimit('user-1')).toBe(true)
    })

    it('blocks attempts at the limit', () => {
      // Make 3 attempts (the max)
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')

      // 4th attempt should be blocked
      expect(limiter.checkLimit('user-1')).toBe(false)
    })

    it('tracks different users independently', () => {
      // Max out user-1
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')

      // User-1 blocked
      expect(limiter.checkLimit('user-1')).toBe(false)

      // User-2 still allowed
      expect(limiter.checkLimit('user-2')).toBe(true)
    })

    it('allows new attempts after window expires', async () => {
      // Max out attempts
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')

      // Blocked now
      expect(limiter.checkLimit('user-1')).toBe(false)

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Should be allowed again
      expect(limiter.checkLimit('user-1')).toBe(true)
    })

    it('uses sliding window (not fixed window)', async () => {
      // Make first attempt
      limiter.recordAttempt('user-1')

      // Wait 600ms
      await new Promise((resolve) => setTimeout(resolve, 600))

      // Make two more attempts
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')

      // Should be at limit now
      expect(limiter.checkLimit('user-1')).toBe(false)

      // Wait 500ms more (1100ms total, first attempt should have expired)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Should be allowed again (only 2 attempts in window)
      expect(limiter.checkLimit('user-1')).toBe(true)
    })
  })

  describe('recordAttempt', () => {
    it('records attempts correctly', () => {
      expect(limiter.getRemainingAttempts('user-1')).toBe(3)

      limiter.recordAttempt('user-1')
      expect(limiter.getRemainingAttempts('user-1')).toBe(2)

      limiter.recordAttempt('user-1')
      expect(limiter.getRemainingAttempts('user-1')).toBe(1)

      limiter.recordAttempt('user-1')
      expect(limiter.getRemainingAttempts('user-1')).toBe(0)
    })

    it('handles multiple rapid attempts', () => {
      // Simulate rapid-fire attempts
      for (let i = 0; i < 5; i++) {
        limiter.recordAttempt('user-1')
      }

      expect(limiter.getRemainingAttempts('user-1')).toBe(0)
      expect(limiter.checkLimit('user-1')).toBe(false)
    })
  })

  describe('getRemainingAttempts', () => {
    it('returns max attempts for new user', () => {
      expect(limiter.getRemainingAttempts('user-1')).toBe(3)
    })

    it('decreases with each attempt', () => {
      expect(limiter.getRemainingAttempts('user-1')).toBe(3)
      limiter.recordAttempt('user-1')
      expect(limiter.getRemainingAttempts('user-1')).toBe(2)
      limiter.recordAttempt('user-1')
      expect(limiter.getRemainingAttempts('user-1')).toBe(1)
    })

    it('returns 0 when limit reached', () => {
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')
      expect(limiter.getRemainingAttempts('user-1')).toBe(0)
    })

    it('never returns negative values', () => {
      // Over-record attempts
      for (let i = 0; i < 10; i++) {
        limiter.recordAttempt('user-1')
      }
      expect(limiter.getRemainingAttempts('user-1')).toBe(0)
    })
  })

  describe('getTimeUntilReset', () => {
    it('returns 0 for new user with no attempts', () => {
      expect(limiter.getTimeUntilReset('user-1')).toBe(0)
    })

    it('returns time until oldest attempt expires', async () => {
      limiter.recordAttempt('user-1')

      // Should be close to windowMs
      const timeUntilReset = limiter.getTimeUntilReset('user-1')
      expect(timeUntilReset).toBeGreaterThan(900) // Allow some margin
      expect(timeUntilReset).toBeLessThanOrEqual(1000)

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Should decrease
      const timeUntilReset2 = limiter.getTimeUntilReset('user-1')
      expect(timeUntilReset2).toBeLessThan(timeUntilReset)
      expect(timeUntilReset2).toBeGreaterThan(600)
    })

    it('returns 0 after window expires', async () => {
      limiter.recordAttempt('user-1')

      // Wait for window to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      expect(limiter.getTimeUntilReset('user-1')).toBe(0)
    })
  })

  describe('reset', () => {
    it('clears all attempts for a user', () => {
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-1')

      expect(limiter.checkLimit('user-1')).toBe(false)

      limiter.reset('user-1')

      expect(limiter.checkLimit('user-1')).toBe(true)
      expect(limiter.getRemainingAttempts('user-1')).toBe(3)
    })

    it('does not affect other users', () => {
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-2')

      limiter.reset('user-1')

      expect(limiter.getRemainingAttempts('user-1')).toBe(3)
      expect(limiter.getRemainingAttempts('user-2')).toBe(2)
    })

    it('is safe to call on non-existent user', () => {
      expect(() => limiter.reset('user-1')).not.toThrow()
    })
  })

  describe('clearAll', () => {
    it('resets all users', () => {
      limiter.recordAttempt('user-1')
      limiter.recordAttempt('user-2')
      limiter.recordAttempt('user-3')

      limiter.clearAll()

      expect(limiter.getRemainingAttempts('user-1')).toBe(3)
      expect(limiter.getRemainingAttempts('user-2')).toBe(3)
      expect(limiter.getRemainingAttempts('user-3')).toBe(3)
    })
  })

  describe('cleanup', () => {
    it('removes expired attempts automatically', async () => {
      // Create limiter with fast cleanup
      const fastLimiter = new RateLimiter({
        maxAttempts: 3,
        windowMs: 500,
        cleanupIntervalMs: 600,
      })

      try {
        fastLimiter.recordAttempt('user-1')
        fastLimiter.recordAttempt('user-2')

        // Wait for attempts to expire and cleanup to run
        await new Promise((resolve) => setTimeout(resolve, 1200))

        // Both users should be reset
        expect(fastLimiter.getRemainingAttempts('user-1')).toBe(3)
        expect(fastLimiter.getRemainingAttempts('user-2')).toBe(3)
      } finally {
        fastLimiter.stopCleanup()
      }
    })
  })

  describe('stopCleanup', () => {
    it('stops the cleanup interval', () => {
      const testLimiter = new RateLimiter({
        maxAttempts: 3,
        windowMs: 1000,
        cleanupIntervalMs: 100,
      })

      // Should have started cleanup
      testLimiter.stopCleanup()

      // Should not throw
      expect(() => testLimiter.stopCleanup()).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles empty string keys', () => {
      expect(limiter.checkLimit('')).toBe(true)
      limiter.recordAttempt('')
      expect(limiter.getRemainingAttempts('')).toBe(2)
    })

    it('handles very long keys', () => {
      const longKey = 'a'.repeat(1000)
      expect(limiter.checkLimit(longKey)).toBe(true)
      limiter.recordAttempt(longKey)
      expect(limiter.getRemainingAttempts(longKey)).toBe(2)
    })

    it('handles special characters in keys', () => {
      const specialKey = 'user@example.com!#$%'
      expect(limiter.checkLimit(specialKey)).toBe(true)
      limiter.recordAttempt(specialKey)
      expect(limiter.getRemainingAttempts(specialKey)).toBe(2)
    })
  })

  describe('concurrent access', () => {
    it('handles rapid concurrent checks', () => {
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(limiter.checkLimit('user-1'))
        if (i < 3) {
          limiter.recordAttempt('user-1')
        }
      }

      // First 3 checks should pass, rest should fail
      expect(results.slice(0, 3).every((r) => r === true)).toBe(true)
      expect(results.slice(3).every((r) => r === false)).toBe(true)
    })
  })

  describe('real-world scenarios', () => {
    it('simulates password change attempts', () => {
      const userId = 'user-123'

      // Simulate 3 failed password changes
      for (let i = 0; i < 3; i++) {
        expect(limiter.checkLimit(userId)).toBe(true)
        limiter.recordAttempt(userId)
      }

      // User should be rate limited now
      expect(limiter.checkLimit(userId)).toBe(false)

      // Show remaining time
      const resetTime = limiter.getTimeUntilReset(userId)
      expect(resetTime).toBeGreaterThan(0)
    })

    it('allows gradual attempts over time', async () => {
      const userId = 'user-123'

      // Make 2 attempts
      limiter.recordAttempt(userId)
      limiter.recordAttempt(userId)

      // Wait for first attempt to expire
      await new Promise((resolve) => setTimeout(resolve, 1100))

      // Should be able to make another attempt (only 1 in window now)
      expect(limiter.checkLimit(userId)).toBe(true)
      limiter.recordAttempt(userId)

      // Should still be under limit
      expect(limiter.checkLimit(userId)).toBe(true)
    })
  })
})
