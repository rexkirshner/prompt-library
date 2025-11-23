# lib/db

Database utilities and Prisma Client singleton.

## Purpose

This module provides a centralized database client and utilities for interacting with PostgreSQL via Prisma.

## Usage

### Basic Queries

```typescript
import { prisma } from '@/lib/db/client'

// Create a prompt
const prompt = await prisma.prompt.create({
  data: {
    title: 'Code Review Assistant',
    promptText: 'Review the following code...',
    category: 'Coding & Development',
    authorName: 'John Doe',
    slug: 'code-review-assistant',
  },
})

// Find prompts
const prompts = await prisma.prompt.findMany({
  where: { status: 'APPROVED' },
  include: { tags: { include: { tag: true } } },
  orderBy: { createdAt: 'desc' },
  take: 10,
})

// Update a prompt
await prisma.prompt.update({
  where: { id: promptId },
  data: { viewCount: { increment: 1 } },
})
```

### Transactions

```typescript
import { prisma } from '@/lib/db/client'

// Atomic operations
const result = await prisma.$transaction(async (tx) => {
  // Approve prompt
  const prompt = await tx.prompt.update({
    where: { id: promptId },
    data: {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedById: userId,
    },
  })

  // Log admin action
  await tx.adminAction.create({
    data: {
      userId,
      action: 'approve',
      targetType: 'prompt',
      targetId: promptId,
      metadata: { promptTitle: prompt.title },
    },
  })

  return prompt
})
```

### Type-Safe Queries

```typescript
import { type Prompt, type Tag } from '@/lib/db/client'

// TypeScript knows the shape of these objects
const prompt: Prompt = await prisma.prompt.findUniqueOrThrow({
  where: { slug: 'code-review-assistant' },
})
```

## Client Configuration

The Prisma Client is configured as a singleton to prevent connection issues during development (Next.js hot reload).

**Features:**
- Single instance across app
- Query logging in development
- Error logging in production
- Type-safe database access

## Best Practices

**DO:**
- Always use the singleton client from `@/lib/db/client`
- Use transactions for related operations
- Handle errors appropriately
- Close connections in serverless functions (automatic with Prisma)
- Use `include` and `select` to optimize queries

**DON'T:**
- Create new `PrismaClient()` instances directly
- Forget to handle database errors
- Use raw SQL unless absolutely necessary
- Skip input validation before database operations

## Environment Variables

Required in `.env` or `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Error Handling

```typescript
import { Prisma } from '@prisma/client'

try {
  await prisma.prompt.create({ data: promptData })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known errors (unique constraint, etc.)
    if (error.code === 'P2002') {
      console.error('Unique constraint violation')
    }
  } else {
    // Handle unknown errors
    throw error
  }
}
```

## Testing

Tests use a separate test database:

```typescript
// Set DATABASE_URL to test database in test environment
process.env.DATABASE_URL = 'postgresql://test...'
```

See `__tests__/client.test.ts` for examples.

## Related Documentation

- [Prisma Documentation](https://www.prisma.io/docs)
- [Schema](../../prisma/README.md)
- [Database Models](../../context/PRD.md#data-models)
