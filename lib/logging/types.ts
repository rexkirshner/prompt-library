/**
 * Logging Types
 *
 * Type definitions for structured logging system.
 */

/**
 * Log levels in order of severity (least to most)
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

/**
 * Log context - additional structured data attached to log entries
 */
export interface LogContext {
  [key: string]: unknown
}

/**
 * Logger interface for dependency injection and testing
 */
export interface Logger {
  /**
   * Debug-level logging for detailed diagnostic information
   */
  debug(message: string, context?: LogContext): void

  /**
   * Info-level logging for general informational messages
   */
  info(message: string, context?: LogContext): void

  /**
   * Warn-level logging for warning messages (non-critical issues)
   */
  warn(message: string, context?: LogContext): void

  /**
   * Error-level logging for error conditions
   */
  error(message: string, error?: Error, context?: LogContext): void

  /**
   * Fatal-level logging for fatal errors (application should exit)
   */
  fatal(message: string, error?: Error, context?: LogContext): void

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger
}

/**
 * Logger configuration options
 */
export interface LoggerConfig {
  /**
   * Minimum log level to output
   * @default 'info' in production, 'debug' in development
   */
  level?: LogLevel

  /**
   * Enable pretty printing for development
   * @default true in development, false in production
   */
  pretty?: boolean

  /**
   * Application name to include in logs
   */
  name?: string

  /**
   * Base context to include in all logs
   */
  baseContext?: LogContext
}
