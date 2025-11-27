# Logging Module

Structured logging for the AI Prompt Library application using [Pino](https://getpino.io).

## Features

- **Structured JSON logging** in production for log aggregation
- **Pretty-printed logs** in development for readability
- **Type-safe** logging with TypeScript
- **Error serialization** with stack traces
- **Child loggers** for module-specific context
- **Multiple log levels**: debug, info, warn, error, fatal

## Usage

### Basic Logging

```typescript
import { logger } from '@/lib/logging'

// Info level
logger.info('Server started', { port: 3000 })

// Warning
logger.warn('Deprecated API used', { endpoint: '/old-api' })

// Error with Error object
try {
  throw new Error('Database connection failed')
} catch (error) {
  logger.error('Failed to connect', error as Error, {
    database: 'postgres',
    attempt: 3
  })
}
```

### Module-Specific Loggers

Create child loggers with additional context:

```typescript
import { logger } from '@/lib/logging'

const authLogger = logger.child({ module: 'auth' })

authLogger.info('User logged in', { userId: '123' })
// Output: {"level":"info","module":"auth","userId":"123","msg":"User logged in"}
```

### Log Levels

Logs in order of severity (least to most):

- `debug` - Detailed diagnostic information
- `info` - General informational messages
- `warn` - Warning messages (non-critical issues)
- `error` - Error conditions
- `fatal` - Fatal errors (application should exit)

**Default levels:**
- **Development**: `debug` (logs everything)
- **Production**: `info` (skips debug logs)

## Configuration

### Environment Variables

Control logging behavior via environment variables:

```bash
# Set minimum log level (debug, info, warn, error, fatal)
LOG_LEVEL=info

# Enable/disable pretty printing (overrides NODE_ENV detection)
LOG_PRETTY=true

# Set application name in logs
LOG_NAME="prompt-library"
```

### Custom Configuration

Create a configured logger instance:

```typescript
import { createLogger } from '@/lib/logging'

const customLogger = createLogger({
  level: 'warn',
  pretty: false,
  name: 'my-service',
  baseContext: { env: 'staging' }
})
```

## Output Formats

### Development (Pretty)

```
[13:45:23] INFO (prompt-library): Server started
    port: 3000
[13:45:24] ERROR (prompt-library): Database connection failed
    err: {
      "type": "Error",
      "message": "Connection timeout",
      "stack": "Error: Connection timeout\n    at connect (db.ts:12)"
    }
```

### Production (JSON)

```json
{"level":30,"time":"2025-11-26T13:45:23.000Z","name":"prompt-library","msg":"Server started","port":3000}
{"level":50,"time":"2025-11-26T13:45:24.000Z","name":"prompt-library","msg":"Database connection failed","err":{"type":"Error","message":"Connection timeout","stack":"Error: Connection timeout\n    at connect (db.ts:12)"}}
```

## Best Practices

### 1. Add Contextual Information

Always include relevant context to make logs searchable and useful:

```typescript
// Bad
logger.error('Import failed')

// Good
logger.error('Import failed', error, {
  operation: 'prompt-import',
  userId: user.id,
  promptCount: prompts.length,
  format: 'json'
})
```

### 2. Use Appropriate Log Levels

- **debug**: Trace execution flow, variable values
- **info**: Normal operations (startup, user actions)
- **warn**: Unusual but handled situations
- **error**: Errors that need attention
- **fatal**: Critical errors requiring immediate shutdown

### 3. Structure Error Logs

Always pass Error objects to capture stack traces:

```typescript
// Bad
logger.error(`Error: ${error.message}`)

// Good
logger.error('Operation failed', error as Error, { operation: 'sync' })
```

### 4. Create Module Loggers

Use child loggers to add module context automatically:

```typescript
// In lib/auth/service.ts
const logger = logger.child({ module: 'auth-service' })

// All logs from this module include { module: 'auth-service' }
logger.info('Processing login')
logger.error('Authentication failed', error)
```

### 5. Avoid Sensitive Data

Never log passwords, tokens, or PII:

```typescript
// Bad
logger.info('User data', { password: user.password })

// Good
logger.info('User authenticated', { userId: user.id, email: sanitizeEmail(user.email) })
```

## Migration from console.log

Replacing console statements:

```typescript
// Before
console.log('Processing prompt:', prompt.id)
console.error('Failed:', error)

// After
logger.info('Processing prompt', { promptId: prompt.id })
logger.error('Operation failed', error, { operation: 'process-prompt' })
```

## Testing

Import logger in tests and verify log calls:

```typescript
import { logger } from '@/lib/logging'

// Mock logger in tests
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    // ... other methods
  }
}))

// Verify logs
expect(logger.info).toHaveBeenCalledWith('Operation completed', { count: 5 })
```

## Integration with Error Tracking

For production error tracking (Sentry, etc.), logs at `error` and `fatal` levels should be forwarded to your error tracking service.

Example Sentry integration:

```typescript
import * as Sentry from '@sentry/nextjs'
import { logger as baseLogger } from '@/lib/logging'

// Wrap logger to send errors to Sentry
const logger = {
  ...baseLogger,
  error: (msg: string, error?: Error, context?: any) => {
    baseLogger.error(msg, error, context)
    if (error) Sentry.captureException(error, { extra: context })
  },
  fatal: (msg: string, error?: Error, context?: any) => {
    baseLogger.fatal(msg, error, context)
    if (error) Sentry.captureException(error, { level: 'fatal', extra: context })
  },
}
```

## Performance

Pino is designed for high performance:
- **Zero overhead** in production when level filters logs
- **Asynchronous** I/O doesn't block application
- **Minimal allocations** for garbage collection efficiency

## Troubleshooting

### Logs not appearing

Check your `LOG_LEVEL` environment variable:

```bash
# See all logs including debug
LOG_LEVEL=debug npm run dev
```

### Pretty printing not working

Ensure `pino-pretty` is installed:

```bash
npm install --save-dev pino-pretty
```

### JSON in development

Disable pretty printing:

```bash
LOG_PRETTY=false npm run dev
```

## References

- [Pino Documentation](https://getpino.io)
- [Pino Best Practices](https://getpino.io/#/docs/best-practices)
- [Structured Logging Guide](https://www.honeycomb.io/blog/structured-logging-and-your-team)
