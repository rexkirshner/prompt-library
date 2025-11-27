/**
 * Client-Side Logger
 *
 * Lightweight logging abstraction for browser/client code.
 * Currently wraps console methods but designed for easy Sentry integration.
 *
 * FUTURE INTEGRATION:
 * To add Sentry, just replace console calls in this file with Sentry.captureException()
 * All client-side error logging will automatically flow to Sentry.
 *
 * @example
 * ```typescript
 * import { clientLogger } from '@/lib/logging/client'
 *
 * // Simple error logging
 * clientLogger.error('Failed to load data', error)
 *
 * // With context for better debugging
 * clientLogger.error('API request failed', error, {
 *   endpoint: '/api/prompts',
 *   userId: user?.id
 * })
 * ```
 */

export interface ClientLogger {
  /**
   * Log an error with optional context
   *
   * @param message - Human-readable error message
   * @param error - Error object (optional)
   * @param context - Additional context for debugging
   */
  error: (message: string, error?: Error, context?: Record<string, unknown>) => void

  /**
   * Log a warning with optional context
   *
   * @param message - Warning message
   * @param context - Additional context
   */
  warn: (message: string, context?: Record<string, unknown>) => void

  /**
   * Log informational message
   *
   * @param message - Info message
   * @param context - Additional context
   */
  info: (message: string, context?: Record<string, unknown>) => void
}

/**
 * Client-side logger instance
 *
 * Uses console methods in all environments.
 * In production, browser DevTools already filter/format console output well.
 *
 * FUTURE: Replace with Sentry integration
 */
export const clientLogger: ClientLogger = {
  error: (message: string, error?: Error, context?: Record<string, unknown>) => {
    if (error) {
      console.error(message, error, context)
    } else {
      console.error(message, context)
    }
    // FUTURE: Sentry.captureException(error || new Error(message), {
    //   tags: context,
    //   level: 'error'
    // })
  },

  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(message, context)
    // FUTURE: Sentry.captureMessage(message, {
    //   tags: context,
    //   level: 'warning'
    // })
  },

  info: (message: string, context?: Record<string, unknown>) => {
    console.log(message, context)
  },
}
