# Logging Module

Structured logging for Input Atlas with a lightweight custom logger implementation.

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
LOG_NAME="input-atlas"
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

### Development (Pretty Console)

```
[1:45:23 PM] INFO: Server started
  {
    "port": 3000
  }
[1:45:24 PM] ERROR: Database connection failed
  {
    "err": {
      "type": "Error",
      "message": "Connection timeout",
      "stack": "Error: Connection timeout\n    at connect (db.ts:12)"
    }
  }
```

### Production (JSON)

```json
{"level":20,"time":"2025-11-26T13:45:23.000Z","name":"input-atlas","msg":"Server started","port":3000}
{"level":40,"time":"2025-11-26T13:45:24.000Z","name":"input-atlas","msg":"Database connection failed","err":{"type":"Error","message":"Connection timeout","stack":"Error: Connection timeout\n    at connect (db.ts:12)"}}
```

Note: Log levels are numeric (debug=10, info=20, warn=30, error=40, fatal=50).

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

The custom logger is designed for minimal overhead:
- **Zero dependencies** - No external logging libraries
- **Level filtering** - Logs below configured level are skipped
- **Lightweight** - Simple console-based implementation
- **Next.js compatible** - Works with Turbopack builds

## Troubleshooting

### Logs not appearing

Check your `LOG_LEVEL` environment variable:

```bash
# See all logs including debug
LOG_LEVEL=debug npm run dev
```

### JSON logs in development

The logger automatically uses pretty console output in development (NODE_ENV !== 'production'). To force JSON output:

```bash
NODE_ENV=production npm run dev
```

## Architecture Notes

This is a custom lightweight logger implementation built specifically for Next.js compatibility. Earlier versions used Pino, but it had bundling issues with Next.js Turbopack. The custom implementation:

- Uses native console methods for output
- Formats as JSON in production for log aggregation
- Formats as pretty console output in development
- Maintains the same API surface as the Pino implementation

## References

- [Structured Logging Guide](https://www.honeycomb.io/blog/structured-logging-and-your-team)
- [Next.js Logging Best Practices](https://nextjs.org/docs)
