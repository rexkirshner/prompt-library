/**
 * Tests for View Tracking Utilities
 *
 * @module lib/analytics/__tests__/view-tracker.test
 */

import { trackPromptView, hasRecentView, clearViewCookie } from '../view-tracker'
import { prisma } from '@/lib/db/client'
import { cookies } from 'next/headers'

// Mock dependencies
jest.mock('@/lib/db/client', () => ({
  prisma: {
    prompts: {
      update: jest.fn(),
    },
  },
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

// Mock logger to prevent console output in tests
jest.mock('@/lib/logging', () => ({
  logger: {
    child: () => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}))

describe('View Tracking Utilities', () => {
  const mockPromptId = 'test-prompt-id-123'
  const mockSlug = 'test-prompt-slug'
  const cookieName = `viewed_prompt_${mockPromptId}`

  let mockCookieStore: {
    has: jest.Mock
    set: jest.Mock
    delete: jest.Mock
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock cookie store
    mockCookieStore = {
      has: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
    }

    ;(cookies as jest.Mock).mockResolvedValue(mockCookieStore)
  })

  describe('trackPromptView', () => {
    it('increments view count and sets cookie when no cookie exists', async () => {
      // Setup: No existing cookie
      mockCookieStore.has.mockReturnValue(false)

      // Setup: Successful database update
      const updatePromise = Promise.resolve({ id: mockPromptId, view_count: 1 })
      ;(prisma.prompts.update as jest.Mock).mockReturnValue(updatePromise)

      // Execute
      await trackPromptView(mockPromptId, mockSlug)

      // Allow time for fire-and-forget promise
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Verify: Cookie check was performed
      expect(mockCookieStore.has).toHaveBeenCalledWith(cookieName)

      // Verify: View count was incremented
      expect(prisma.prompts.update).toHaveBeenCalledWith({
        where: { id: mockPromptId },
        data: { view_count: { increment: 1 } },
      })

      // Verify: Cookie was set with correct properties
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        cookieName,
        '1',
        expect.objectContaining({
          maxAge: 86400, // 24 hours
          httpOnly: true,
          sameSite: 'lax',
          secure: false, // false in test environment
        })
      )
    })

    it('does not increment view count when cookie exists', async () => {
      // Setup: Cookie exists
      mockCookieStore.has.mockReturnValue(true)

      // Execute
      await trackPromptView(mockPromptId, mockSlug)

      // Verify: Cookie check was performed
      expect(mockCookieStore.has).toHaveBeenCalledWith(cookieName)

      // Verify: View count was NOT incremented
      expect(prisma.prompts.update).not.toHaveBeenCalled()

      // Verify: Cookie was NOT set again
      expect(mockCookieStore.set).not.toHaveBeenCalled()
    })

    it('sets cookie even if database update fails', async () => {
      // Setup: No existing cookie
      mockCookieStore.has.mockReturnValue(false)

      // Setup: Database update fails
      const updatePromise = Promise.reject(new Error('Database error'))
      ;(prisma.prompts.update as jest.Mock).mockReturnValue(updatePromise)

      // Execute
      await trackPromptView(mockPromptId, mockSlug)

      // Allow time for fire-and-forget promise to reject
      await new Promise((resolve) => setTimeout(resolve, 10))

      // Verify: Cookie was still set (we don't want tracking failures to affect UX)
      expect(mockCookieStore.set).toHaveBeenCalled()
    })

    it('handles cookie store errors gracefully', async () => {
      // Setup: Cookie store throws error
      ;(cookies as jest.Mock).mockRejectedValue(new Error('Cookie error'))

      // Execute - should not throw
      await expect(trackPromptView(mockPromptId, mockSlug)).resolves.toBeUndefined()

      // Verify: Database was not called due to early error
      expect(prisma.prompts.update).not.toHaveBeenCalled()
    })

    it('uses secure cookies in production', async () => {
      // Setup: Production environment
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      // Setup: No existing cookie
      mockCookieStore.has.mockReturnValue(false)
      ;(prisma.prompts.update as jest.Mock).mockReturnValue(
        Promise.resolve({ id: mockPromptId, view_count: 1 })
      )

      // Execute
      await trackPromptView(mockPromptId, mockSlug)

      // Verify: Cookie was set with secure flag
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        cookieName,
        '1',
        expect.objectContaining({
          secure: true,
        })
      )

      // Cleanup
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('hasRecentView', () => {
    it('returns true when cookie exists', async () => {
      // Setup
      mockCookieStore.has.mockReturnValue(true)

      // Execute
      const result = await hasRecentView(mockPromptId)

      // Verify
      expect(result).toBe(true)
      expect(mockCookieStore.has).toHaveBeenCalledWith(cookieName)
    })

    it('returns false when cookie does not exist', async () => {
      // Setup
      mockCookieStore.has.mockReturnValue(false)

      // Execute
      const result = await hasRecentView(mockPromptId)

      // Verify
      expect(result).toBe(false)
      expect(mockCookieStore.has).toHaveBeenCalledWith(cookieName)
    })

    it('returns false on error', async () => {
      // Setup: Cookie store throws error
      ;(cookies as jest.Mock).mockRejectedValue(new Error('Cookie error'))

      // Execute
      const result = await hasRecentView(mockPromptId)

      // Verify: Returns false instead of throwing
      expect(result).toBe(false)
    })
  })

  describe('clearViewCookie', () => {
    it('deletes the view cookie', async () => {
      // Execute
      await clearViewCookie(mockPromptId)

      // Verify
      expect(mockCookieStore.delete).toHaveBeenCalledWith(cookieName)
    })

    it('handles errors gracefully', async () => {
      // Setup: Cookie store throws error
      ;(cookies as jest.Mock).mockRejectedValue(new Error('Cookie error'))

      // Execute - should not throw
      await expect(clearViewCookie(mockPromptId)).resolves.toBeUndefined()
    })
  })
})
