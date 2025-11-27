/**
 * Logging Module
 *
 * Structured logging for the AI Prompt Library application.
 *
 * @example
 * ```typescript
 * import { logger } from '@/lib/logging'
 *
 * logger.info('Operation completed', { userId: '123', duration: 450 })
 * logger.error('Failed to process', error, { operation: 'import' })
 * ```
 *
 * @example Create module-specific logger
 * ```typescript
 * import { logger } from '@/lib/logging'
 *
 * const authLogger = logger.child({ module: 'auth' })
 * authLogger.info('User logged in', { userId })
 * ```
 */

export { createLogger, defaultLogger as logger } from './logger'
export type { Logger, LoggerConfig, LogContext, LogLevel } from './types'
