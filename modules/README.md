# modules/

Feature-based modules containing business logic and feature-specific components.

## Purpose

This directory organizes code by **feature** rather than by type. Each module is a self-contained feature that can include its own components, hooks, utilities, and tests.

## Organization

Each module follows this structure:

```
modules/
└── prompts/                    # Feature: Prompt management
    ├── README.md               # Module documentation
    ├── components/             # Feature-specific components
    │   ├── prompt-card.tsx
    │   ├── prompt-form.tsx
    │   └── __tests__/
    ├── hooks/                  # Feature-specific React hooks
    │   ├── use-prompt.ts
    │   ├── use-prompts.ts
    │   └── __tests__/
    ├── actions/                # Server actions (Next.js)
    │   ├── create-prompt.ts
    │   ├── update-prompt.ts
    │   └── __tests__/
    ├── lib/                    # Feature-specific utilities
    │   ├── validation.ts
    │   └── __tests__/
    └── types.ts                # Feature-specific types
```

## Planned Modules

Based on the PRD, we'll have these modules:

- **`auth/`** - Authentication (NextAuth.js integration, user sessions)
- **`prompts/`** - Prompt submission, editing, display
- **`search/`** - Full-text search, filtering, pagination
- **`moderation/`** - Admin moderation queue, approval workflow
- **`tags/`** - Tag management, tagging system
- **`analytics/`** - View counts, copy counts, basic stats

## Guidelines

**DO:**

- Keep modules focused on a single feature
- Write comprehensive tests at the module level
- Document module purpose in its README.md
- Use feature flags for experimental features
- Follow the same structure across all modules

**DON'T:**

- Create dependencies between modules (use `lib/` for shared code)
- Mix unrelated features in one module
- Skip documentation
- Forget to add tests

## Module Dependencies

```
Modules can import from:
✅ lib/              (shared utilities)
✅ components/       (shared UI components)
✅ types/            (shared types)
✅ Same module       (internal dependencies)

Modules should NOT import from:
❌ Other modules     (creates coupling - use lib/ instead)
❌ app/              (app directory imports from modules, not vice versa)
```

## Example Module Structure

```
modules/prompts/
├── README.md
├── components/
│   ├── prompt-card.tsx          # Display a single prompt
│   ├── prompt-form.tsx          # Create/edit prompt form
│   ├── prompt-list.tsx          # List of prompts
│   └── __tests__/
│       ├── prompt-card.test.tsx
│       └── prompt-form.test.tsx
├── hooks/
│   ├── use-prompt.ts            # Fetch single prompt
│   ├── use-prompts.ts           # Fetch prompt list
│   ├── use-create-prompt.ts    # Create prompt mutation
│   └── __tests__/
├── actions/
│   ├── create-prompt.ts         # Server action: create
│   ├── update-prompt.ts         # Server action: update
│   ├── delete-prompt.ts         # Server action: delete
│   └── __tests__/
├── lib/
│   ├── validation.ts            # Prompt validation logic
│   ├── slug.ts                  # Slug generation
│   └── __tests__/
└── types.ts                     # Feature-specific types
```

## Creating a New Module

1. Create the module directory: `modules/[feature-name]/`
2. Add a README.md explaining the feature
3. Create subdirectories as needed (components, hooks, actions, lib)
4. Add `__tests__/` directories for testing
5. Document the module in this README

## Testing Strategy

Each module should have comprehensive test coverage:

- **Unit tests**: `lib/` utilities, validation logic
- **Hook tests**: React hooks with `@testing-library/react-hooks`
- **Component tests**: UI components with `@testing-library/react`
- **Integration tests**: Server actions with mock database

Target: **80%+ code coverage** per module
