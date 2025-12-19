# CODE_STYLE.md

**Coding standards and conventions** for this project.

**For architectural patterns:** See `ARCHITECTURE.md`
**For current status:** See `STATUS.md`

---

## Core Principles

### 1. Simplicity First

**YAGNI (You Aren't Gonna Need It)** - Don't build features before they're needed.

- Keep solutions minimal and focused
- Avoid premature optimization
- Don't add abstractions until you have 3+ use cases
- Prefer explicit code over clever code
- Resist the urge to future-proof

### 2. No Temporary Fixes

**Fix root causes, not symptoms.**

- No band-aids or workarounds
- If you find a bug, fix the underlying issue
- Don't add feature flags for broken code
- Address technical debt immediately
- Follow problems to their source

### 3. Minimal Impact

**Change only what's necessary.**

- Don't refactor code you're not modifying
- Don't add comments/types to unchanged code
- Fix the bug without "improving" surrounding code
- Keep pull requests focused and small
- Respect existing patterns unless there's a clear reason to change

---

## Language Standards

### TypeScript

**Configuration:**
- Strict mode enabled (`"strict": true`)
- Target: ES2017
- Use `@/` path alias for imports from project root

**Type Safety:**
```typescript
// ✅ DO: Use proper types
interface PromptSubmissionData {
  title: string
  promptText: string
  category: string
}

// ✅ DO: Use Prisma-generated types
import type { prompts, users } from '@prisma/client'

// ❌ DON'T: Use 'any'
function process(data: any) { } // NEVER

// ✅ DO: Use 'unknown' if type truly unknown
function process(data: unknown) {
  if (typeof data === 'string') { /* ... */ }
}
```

**Interfaces vs Types:**
- Use `interface` for object shapes
- Use `type` for unions, intersections, and primitives
- Export types when used across files

---

## File Organization

### Directory Structure

```
app/                    # Next.js App Router pages
├── (auth)/            # Auth route group
├── admin/             # Admin pages
├── prompts/           # Public prompt pages
└── submit/            # Submission flow
lib/                   # Shared utilities and business logic
├── auth/              # Authentication utilities
├── db/                # Database client and types
└── prompts/           # Prompt-specific utilities
components/            # React components
├── ui/                # Reusable UI components
└── forms/             # Form components
prisma/                # Prisma schema and migrations
context/               # AI Context System documentation
```

### File Naming

- **React components:** PascalCase (`PromptCard.tsx`)
- **Utilities:** camelCase (`validation.ts`)
- **Server Actions:** `actions.ts` in feature directory
- **Tests:** Co-locate with source (`validation.test.ts` or `__tests__/validation.test.ts`)

---

## React & Next.js

### Server vs Client Components

**Default to Server Components.**

```typescript
// ✅ DO: Server Component (default)
// app/prompts/page.tsx
import { prisma } from '@/lib/db/client'

export default async function PromptsPage() {
  const prompts = await prisma.prompts.findMany()
  return <div>{/* ... */}</div>
}

// ✅ DO: Client Component (only when needed)
// components/forms/SubmitForm.tsx
'use client'

import { useState } from 'react'

export function SubmitForm() {
  const [value, setValue] = useState('')
  return <form>{/* ... */}</form>
}
```

**Use Client Components for:**
- Interactive UI (forms, modals, dropdowns)
- Browser APIs (localStorage, geolocation)
- React hooks (useState, useEffect, useContext)
- Event handlers (onClick, onChange)

### Server Actions

**Pattern:**
```typescript
// app/submit/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'

export async function submitPrompt(data: FormData) {
  // 1. Get authenticated user
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, errors: { auth: 'Not authenticated' } }
  }

  // 2. Validate input
  const validation = validatePromptSubmission(data)
  if (!validation.success) {
    return { success: false, errors: validation.errors }
  }

  // 3. Perform database operation
  const prompt = await prisma.prompts.create({
    data: { /* ... */ }
  })

  // 4. Return success or redirect
  redirect(`/prompts/${prompt.slug}`)
}
```

**Guidelines:**
- Always validate input
- Check authentication/authorization first
- Return structured error objects: `{ success: boolean, errors?: Record<string, string> }`
- Use `redirect()` for navigation after mutations
- Keep business logic in separate functions

---

## Database & Prisma

### Schema Conventions

**Field Naming:**
- Use `snake_case` for database fields (PostgreSQL convention)
- Use `camelCase` in TypeScript types (JavaScript convention)
- Prisma handles conversion automatically

```prisma
// ✅ DO: snake_case in schema
model users {
  id            String   @id @default(uuid())
  email         String   @unique
  password_hash String
  is_admin      Boolean  @default(false)
  created_at    DateTime @default(now())
}
```

```typescript
// ✅ DO: camelCase in TypeScript
const user = await prisma.users.findUnique({
  where: { email: 'user@example.com' }
})
// user.isAdmin, user.createdAt (camelCase)
```

### Query Patterns

**Use transactions for related operations:**
```typescript
// ✅ DO: Transaction for multiple related writes
await prisma.$transaction([
  prisma.prompts.create({ data: promptData }),
  prisma.tags.updateMany({ where: { id: { in: tagIds } }, data: { usage_count: { increment: 1 } } })
])
```

**Select only needed fields:**
```typescript
// ✅ DO: Select specific fields
const prompts = await prisma.prompts.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    description: true,
    // Don't load full prompt_text for listing page
  }
})

// ❌ DON'T: Load all fields unnecessarily
const prompts = await prisma.prompts.findMany() // Loads everything
```

**Use connection pooling:**
```typescript
// ✅ DO: Configure pool in lib/db/client.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isDevelopment ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
```

---

## Security

### Input Validation

**Always validate at the boundary:**
```typescript
// ✅ DO: Validate before processing
export function validatePromptSubmission(data: PromptSubmissionData) {
  const errors: Record<string, string> = {}

  if (!data.title || data.title.trim().length < 10) {
    errors.title = 'Title must be at least 10 characters'
  }

  return {
    success: Object.keys(errors).length === 0,
    errors
  }
}
```

### XSS Prevention

**Validate URL schemes:**
```typescript
// ✅ DO: Whitelist allowed URL schemes
const ALLOWED_URL_SCHEMES = ['http:', 'https:']

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol)
  } catch {
    return false
  }
}

// ❌ DON'T: Accept any valid URL
// Allows javascript:, data:, file:, etc.
```

### Authentication

**Check auth in Server Actions:**
```typescript
// ✅ DO: Check auth first
export async function deletePrompt(id: string) {
  const user = await getCurrentUser()
  if (!user?.isAdmin) {
    return { success: false, errors: { auth: 'Unauthorized' } }
  }
  // ... proceed with deletion
}
```

---

## Error Handling

### Structured Error Returns

```typescript
// ✅ DO: Return structured errors
interface Result<T> {
  success: boolean
  data?: T
  errors?: Record<string, string>
  message?: string
}

export async function submitPrompt(data: FormData): Promise<Result<string>> {
  try {
    // ... validation and processing
    return { success: true, data: prompt.id }
  } catch (error) {
    console.error('Failed to submit prompt:', error)
    return {
      success: false,
      errors: { server: 'Failed to submit prompt. Please try again.' }
    }
  }
}
```

### Logging

```typescript
// ✅ DO: Log with context
console.log('Processing prompt submission', { userId: user.id, title: data.title })
console.error('Failed to create prompt:', error)
console.warn(`Slug generation took ${attempts} attempts for title: "${title}"`)

// ❌ DON'T: Log sensitive data
console.log('User password:', password) // NEVER
console.log('Session token:', token) // NEVER
```

---

## Testing

### Test Organization

```
lib/
├── prompts/
│   ├── validation.ts
│   └── __tests__/
│       └── validation.test.ts
```

### Test Patterns

```typescript
// ✅ DO: Organize tests by function
describe('validatePromptSubmission', () => {
  describe('title validation', () => {
    it('should accept valid titles', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty title', () => {
      const result = validatePromptSubmission({ ...validData, title: '' })
      expect(result.success).toBe(false)
      expect(result.errors.title).toContain('required')
    })
  })
})
```

### Test Data

```typescript
// ✅ DO: Create reusable test fixtures
const validData: PromptSubmissionData = {
  title: 'Code Review Assistant',
  promptText: 'A'.repeat(200), // Valid length
  description: 'A helpful prompt',
  category: 'Coding & Development',
  tags: ['code-review', 'javascript'],
  authorName: 'John Doe',
  authorUrl: 'https://example.com',
}
```

---

## Documentation

### File Headers

**Include purpose and context:**
```typescript
/**
 * Prompt Submission Validation
 *
 * Client and server-side validation for prompt submissions.
 * Provides type-safe validation with clear error messages.
 */
```

### Function Documentation

**Document non-obvious behavior:**
```typescript
/**
 * Generate unique slug for prompt
 * Appends number suffix if slug already exists
 *
 * @throws Error if unable to generate unique slug after MAX_SLUG_ATTEMPTS
 */
async function generateUniqueSlug(title: string): Promise<string> {
  // Implementation
}
```

**Skip obvious documentation:**
```typescript
// ❌ DON'T: Document the obvious
/**
 * Gets a user by ID
 * @param id - The user ID
 * @returns The user
 */
async function getUser(id: string) { }

// ✅ DO: Just write clear code
async function getUser(id: string) { }
```

---

## Code Review Checklist

Before committing, verify:

- [ ] TypeScript compiles without errors
- [ ] All tests pass (`npm test`)
- [ ] No security vulnerabilities introduced
- [ ] Input validation for user data
- [ ] URL schemes validated (no javascript: URLs)
- [ ] Authentication checks in Server Actions
- [ ] No sensitive data in logs
- [ ] Database queries optimized (select only needed fields)
- [ ] Error handling with structured returns
- [ ] Code follows existing patterns
- [ ] No unnecessary refactoring of unchanged code

---

## Anti-Patterns

### ❌ Over-Engineering

```typescript
// ❌ DON'T: Create abstraction for one use case
class PromptFactory {
  constructor(private validator: Validator) {}
  async create(builder: PromptBuilder): Promise<Prompt> { }
}

// ✅ DO: Keep it simple
async function createPrompt(data: PromptData): Promise<Prompt> {
  const validation = validatePrompt(data)
  if (!validation.success) throw new ValidationError(validation.errors)
  return await prisma.prompts.create({ data })
}
```

### ❌ Premature Abstraction

```typescript
// ❌ DON'T: Create utility for 2 similar lines
function logUserAction(action: string) {
  console.log(`User action: ${action}`)
}

// ✅ DO: Just write the code
console.log('User submitted prompt')
console.log('User deleted prompt')
```

### ❌ Feature Flags for Broken Code

```typescript
// ❌ DON'T: Hide broken code behind flags
if (USE_NEW_VALIDATION) {
  // New broken validation
} else {
  // Old working validation
}

// ✅ DO: Fix the validation and ship it
// No flag needed
```

---

## Tools

### Linting & Formatting

**ESLint:**
- Next.js defaults + TypeScript rules
- Run: `npm run lint`

**TypeScript:**
- Strict mode enabled
- Run: `npm run type-check`

**Testing:**
- Jest with React Testing Library
- Run: `npm test`

### Git Workflow

**Commit Often:**
- Make small, focused commits
- Clear commit messages describing "what" and "why"
- Include `🤖 Generated with [Claude Code](https://claude.com/claude-code)` footer

**Never Push Without Permission:**
- Commits are local only
- Explicit approval required for `git push`
- See: `CLAUDE.md` for AI agent git protocol

---

## Related Documentation

- **Architecture:** See `ARCHITECTURE.md` for system design patterns
- **Decisions:** See `DECISIONS.md` for "why" behind choices
- **Status:** See `STATUS.md` for current work
- **Auth:** See `lib/auth/README.md` for authentication details

---

**Last Updated:** 2025-11-24 (Session 9)
