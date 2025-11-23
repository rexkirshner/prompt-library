# lib/

Shared utilities, helpers, and common functions used across the application.

## Purpose

This directory contains **pure, reusable utility functions** that don't depend on React or specific business logic. Think of it as your application's standard library.

## Organization

```
lib/
├── utils/           # General purpose utilities
│   ├── string.ts    # String manipulation helpers
│   ├── date.ts      # Date formatting and parsing
│   └── validation.ts # Input validation functions
├── db/              # Database utilities (Prisma client, helpers)
├── api/             # API helpers and fetch wrappers
└── constants.ts     # Application-wide constants
```

## Guidelines

**DO:**

- Write pure functions when possible (no side effects)
- Add comprehensive unit tests for all utilities
- Document complex functions with JSDoc
- Keep functions small and focused (single responsibility)
- Use TypeScript for type safety

**DON'T:**

- Import React or UI components
- Include business logic (that belongs in `modules/`)
- Create circular dependencies
- Use browser-only APIs without feature detection

## Example

```typescript
// lib/utils/string.ts
/**
 * Converts a string to a URL-friendly slug
 * @example slugify("Hello World!") // "hello-world"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

## Testing

All utilities should have corresponding test files:

```
lib/utils/string.ts
lib/utils/__tests__/string.test.ts
```
