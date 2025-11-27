/**
 * Logger Implementation
 *
 * Structured logging using Pino.
 * - JSON logs in production for parsing/aggregation
 * - Pretty-printed logs in development for readability
 * - Type-safe logging interface
 * - Error serialization with stack traces
 */

import pino, { type Logger as PinoLogger } from 'pino'
import type { Logger, LoggerConfig, LogContext } from './types'

/**
 * Default logger configuration
 */
const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  pretty: process.env.NODE_ENV !== 'production',
  name: 'prompt-library',
}

/**
 * Create pino transport configuration
 */
function createTransport(pretty: boolean) {
  if (!pretty) {
    // Production: JSON output to stdout
    return undefined
  }

  // Development: pretty-print to stdout
  return {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname',
      singleLine: false,
    },
  }
}

/**
 * Create base pino logger instance
 */
function createPinoLogger(config: LoggerConfig): PinoLogger {
  const { level, pretty, name, baseContext } = config

  return pino({
    name,
    level: level || DEFAULT_CONFIG.level,
    // Transport for pretty printing in development
    transport: createTransport(pretty ?? DEFAULT_CONFIG.pretty ?? false),
    // Base context included in all logs
    base: baseContext || {},
    // Serialize errors properly
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
    },
    // Timestamp in ISO format
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
  })
}

/**
 * Logger implementation wrapping Pino
 */
class LoggerImpl implements Logger {
  constructor(private readonly pinoLogger: PinoLogger) {}

  debug(message: string, context?: LogContext): void {
    this.pinoLogger.debug(context || {}, message)
  }

  info(message: string, context?: LogContext): void {
    this.pinoLogger.info(context || {}, message)
  }

  warn(message: string, context?: LogContext): void {
    this.pinoLogger.warn(context || {}, message)
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (error) {
      this.pinoLogger.error({ err: error, ...context }, message)
    } else {
      this.pinoLogger.error(context || {}, message)
    }
  }

  fatal(message: string, error?: Error, context?: LogContext): void {
    if (error) {
      this.pinoLogger.fatal({ err: error, ...context }, message)
    } else {
      this.pinoLogger.fatal(context || {}, message)
    }
  }

  child(context: LogContext): Logger {
    return new LoggerImpl(this.pinoLogger.child(context))
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
  const pinoLogger = createPinoLogger(mergedConfig)
  return new LoggerImpl(pinoLogger)
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
