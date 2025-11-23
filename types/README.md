# types/

TypeScript type definitions and interfaces used across the application.

## Purpose

This directory contains **shared TypeScript types** that define the shape of data throughout your application. This is your type system's source of truth.

## Organization

```
types/
├── index.ts         # Re-exports all types (barrel file)
├── database.ts      # Database schema types (from Prisma)
├── api.ts           # API request/response types
├── ui.ts            # UI component prop types
└── domain/          # Domain models
    ├── prompt.ts    # Prompt entity types
    ├── user.ts      # User entity types
    └── tag.ts       # Tag entity types
```

## Guidelines

**DO:**

- Use strict TypeScript (`strict: true` in tsconfig.json)
- Document complex types with JSDoc comments
- Use discriminated unions for state management
- Prefer interfaces for object shapes, types for unions/intersections
- Export all types from `index.ts` for easy imports

**DON'T:**

- Include implementation code (only types)
- Create circular type dependencies
- Use `any` (use `unknown` if truly needed)
- Duplicate types across files (DRY principle)

## Example

```typescript
// types/domain/prompt.ts
/**
 * Status of a prompt in the moderation workflow
 */
export type PromptStatus = 'pending' | 'approved' | 'rejected'

/**
 * A user-submitted AI prompt
 */
export interface Prompt {
  id: string
  slug: string
  title: string
  promptText: string
  description: string | null
  exampleOutput: string | null
  category: string
  tags: Tag[]
  authorName: string
  status: PromptStatus
  viewCount: number
  copyCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Data required to create a new prompt
 */
export type CreatePromptInput = Pick<
  Prompt,
  'title' | 'promptText' | 'description' | 'exampleOutput' | 'category' | 'authorName'
> & {
  tagIds: string[]
}
```

## Usage

```typescript
// Import from the barrel file
import type { Prompt, CreatePromptInput, PromptStatus } from '@/types'
```

## Prisma Integration

Types from the Prisma schema are generated automatically. Reference them like this:

```typescript
// types/database.ts
export type { Prompt, User, Tag } from '@prisma/client'
```
