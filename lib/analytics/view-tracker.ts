/**
 * View Tracking Utilities
 *
 * Handles tracking prompt views with deduplication to prevent:
 * - Bot traffic from inflating view counts
 * - Same user refreshing from counting multiple times
 * - Unnecessary database updates
 *
 * Uses httpOnly cookies to track views per user with 24-hour expiry.
 *
 * @module lib/analytics/view-tracker
 */

import { cookies } from 'next/headers'
import { prisma } from '@/lib/db/client'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'analytics:view-tracker' })

/**
 * Cookie configuration for view tracking
 */
const VIEW_COOKIE_CONFIG = {
  /** Cookie name prefix */
  prefix: 'viewed_prompt_',
  /** Cookie expiry in seconds (24 hours) */
  maxAge: 86400,
  /** Use httpOnly for security */
  httpOnly: true,
  /** Use sameSite for CSRF protection */
  sameSite: 'lax' as const,
} as const

/**
 * Get secure flag based on current environment
 * Evaluated at runtime to support testing
 */
function getSecureFlag(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Track a prompt view with deduplication
 *
 * This function checks if the user has already viewed this prompt in the last 24 hours
 * using a cookie. If not, it increments the view count and sets a cookie to prevent
 * duplicate counting.
 *
 * The view count update is fire-and-forget - we don't await it or fail the page load
 * if it errors. This ensures view tracking never blocks or breaks the user experience.
 *
 * @param promptId - UUID of the prompt to track
 * @param slug - Slug of the prompt (for logging)
 * @returns Promise<void> - Resolves immediately, update happens in background
 *
 * @example
 * ```typescript
 * // In a server component or page
 * import { trackPromptView } from '@/lib/analytics/view-tracker'
 *
 * export default async function PromptPage({ params }) {
 *   const prompt = await getPrompt(params.slug)
 *
 *   // Track the view (non-blocking)
 *   await trackPromptView(prompt.id, prompt.slug)
 *
 *   return <div>...</div>
 * }
 * ```
 */
export async function trackPromptView(
  promptId: string,
  slug: string
): Promise<void> {
  try {
    const cookieStore = await cookies()
    const cookieName = `${VIEW_COOKIE_CONFIG.prefix}${promptId}`

    // Check if user has already viewed this prompt recently
    const hasViewed = cookieStore.has(cookieName)

    if (hasViewed) {
      // User already viewed this prompt in last 24 hours - skip increment
      logger.debug('View already tracked, skipping increment', {
        operation: 'view-tracking',
        promptId,
        slug,
        reason: 'cookie-exists',
      })
      return
    }

    // User hasn't viewed recently - increment view count
    // Use fire-and-forget pattern - don't await or block on this
    prisma.prompts
      .update({
        where: { id: promptId },
        data: { view_count: { increment: 1 } },
      })
      .then(() => {
        logger.debug('View count incremented', {
          operation: 'view-tracking',
          promptId,
          slug,
        })
      })
      .catch((err) => {
        logger.warn('Failed to increment view count', {
          operation: 'view-tracking',
          promptId,
          slug,
          error: (err as Error).message,
        })
      })

    // Set cookie to prevent duplicate counting for 24 hours
    cookieStore.set(cookieName, '1', {
      maxAge: VIEW_COOKIE_CONFIG.maxAge,
      httpOnly: VIEW_COOKIE_CONFIG.httpOnly,
      sameSite: VIEW_COOKIE_CONFIG.sameSite,
      secure: getSecureFlag(),
    })

    logger.debug('View tracking cookie set', {
      operation: 'view-tracking',
      promptId,
      slug,
      expiresIn: `${VIEW_COOKIE_CONFIG.maxAge}s`,
    })
  } catch (error) {
    // If view tracking fails for any reason, log it but don't throw
    // View tracking should never break the page
    logger.error(
      'View tracking failed',
      error as Error,
      {
        promptId,
        slug,
      }
    )
  }
}

/**
 * Check if a prompt has been viewed recently (for testing/diagnostics)
 *
 * @param promptId - UUID of the prompt to check
 * @returns Promise<boolean> - True if user has viewed this prompt in last 24 hours
 *
 * @example
 * ```typescript
 * const hasViewed = await hasRecentView('prompt-uuid-here')
 * if (hasViewed) {
 *   console.log('User has already viewed this prompt')
 * }
 * ```
 */
export async function hasRecentView(promptId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const cookieName = `${VIEW_COOKIE_CONFIG.prefix}${promptId}`
    return cookieStore.has(cookieName)
  } catch (error) {
    logger.error(
      'Failed to check view cookie',
      error as Error,
      { promptId }
    )
    return false
  }
}

/**
 * Clear a view tracking cookie (for testing purposes)
 *
 * @param promptId - UUID of the prompt to clear
 *
 * @example
 * ```typescript
 * // In a test
 * await clearViewCookie('prompt-uuid-here')
 * ```
 */
export async function clearViewCookie(promptId: string): Promise<void> {
  try {
    const cookieStore = await cookies()
    const cookieName = `${VIEW_COOKIE_CONFIG.prefix}${promptId}`
    cookieStore.delete(cookieName)
  } catch (error) {
    logger.error(
      'Failed to clear view cookie',
      error as Error,
      { promptId }
    )
  }
}
