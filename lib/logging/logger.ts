/**
 * Logger Implementation
 *
 * Lightweight structured logging for Next.js.
 * - JSON logs for parsing/aggregation in production
 * - Pretty console logs in development
 * - Type-safe logging interface
 * - Error serialization with stack traces
 * - Compatible with Next.js Turbopack builds
 */

import type { Logger, LoggerConfig, LogContext } from './types'

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  name: 'input-atlas',
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
} as const

/**
 * Serialize an error to a JSON-friendly object
 */
function serializeError(error: Error): Record<string, unknown> {
  return {
    type: error.name,
    message: error.message,
    stack: error.stack,
  }
}

/**
 * Format a log entry as JSON
 */
function formatJSON(
  level: string,
  message: string,
  name: string,
  context?: Record<string, unknown>
): string {
  const entry = {
    level: LOG_LEVELS[level as keyof typeof LOG_LEVELS],
    time: new Date().toISOString(),
    name,
    msg: message,
    ...context,
  }
  return JSON.stringify(entry)
}

/**
 * Format a log entry for console (development)
 */
function formatConsole(
  level: string,
  message: string,
  context?: Record<string, unknown>
): string {
  const time = new Date().toLocaleTimeString()
  const levelUpper = level.toUpperCase()
  let output = `[${time}] ${levelUpper}: ${message}`

  if (context && Object.keys(context).length > 0) {
    output += '\n  ' + JSON.stringify(context, null, 2).replace(/\n/g, '\n  ')
  }

  return output
}

/**
 * Logger implementation
 */
class LoggerImpl implements Logger {
  private readonly minLevel: number
  private readonly name: string
  private readonly baseContext: Record<string, unknown>
  private readonly isProd: boolean

  constructor(config: LoggerConfig) {
    this.minLevel = LOG_LEVELS[config.level || DEFAULT_CONFIG.level!]
    this.name = config.name || DEFAULT_CONFIG.name!
    this.baseContext = config.baseContext || {}
    this.isProd = process.env.NODE_ENV === 'production'
  }

  private shouldLog(level: keyof typeof LOG_LEVELS): boolean {
    return LOG_LEVELS[level] >= this.minLevel
  }

  private log(
    level: keyof typeof LOG_LEVELS,
    message: string,
    error?: Error,
    context?: LogContext
  ): void {
    if (!this.shouldLog(level)) return

    const fullContext = {
      ...this.baseContext,
      ...context,
      ...(error ? { err: serializeError(error) } : {}),
    }

    if (this.isProd) {
      // Production: JSON output
      console.log(formatJSON(level, message, this.name, fullContext))
    } else {
      // Development: pretty console output
      const output = formatConsole(level, message, fullContext)

      // Use appropriate console method for coloring in dev
      switch (level) {
        case 'debug':
          console.debug(output)
          break
        case 'info':
          console.info(output)
          break
        case 'warn':
          console.warn(output)
          break
        case 'error':
        case 'fatal':
          console.error(output)
          break
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, undefined, context)
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, undefined, context)
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, undefined, context)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, error, context)
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    this.log('fatal', message, error, context)
  }

  child(context: LogContext): Logger {
    return new LoggerImpl({
      level: Object.keys(LOG_LEVELS).find(
        (k) => LOG_LEVELS[k as keyof typeof LOG_LEVELS] === this.minLevel
      ) as keyof typeof LOG_LEVELS,
      name: this.name,
      baseContext: {
        ...this.baseContext,
        ...context,
      },
    })
  }
}

/**
 * Create a new logger instance
 *
 * @param config - Logger configuration options
 * @returns Configured logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger({ name: 'my-service' })
 * logger.info('Service started')
 * ```
 */
export function createLogger(config?: LoggerConfig): Logger {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config }
  return new LoggerImpl(mergedConfig)
}

/**
 * Default application logger instance
 *
 * Use this for general application logging.
 * For module-specific logging, create a child logger:
 *
 * @example
 * ```typescript
 * const logger = defaultLogger.child({ module: 'auth' })
 * logger.info('User logged in', { userId })
 * ```
 */
export const defaultLogger = createLogger()
