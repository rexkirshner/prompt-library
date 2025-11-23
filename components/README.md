# components/

Shared, reusable UI components used across multiple features.

## Purpose

This directory contains **presentational components** that are used in multiple places throughout the app. These are building blocks for your UI.

## Organization

```
components/
├── ui/              # Base UI primitives (from shadcn/ui)
│   ├── button.tsx
│   ├── card.tsx
│   └── input.tsx
├── layout/          # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   └── sidebar.tsx
└── common/          # Common composite components
    ├── search-bar.tsx
    ├── pagination.tsx
    └── loading-spinner.tsx
```

## Guidelines

**DO:**

- Keep components generic and configurable via props
- Write comprehensive tests for each component
- Document props with TypeScript types
- Follow accessibility best practices (ARIA labels, keyboard nav)
- Use Tailwind CSS for styling

**DON'T:**

- Include business logic or API calls
- Hard-code content (use props instead)
- Create feature-specific components here (use `modules/` instead)
- Import from `modules/` (only from `lib/`, `types/`, and other `components/`)

## Component Template

```typescript
// components/common/search-bar.tsx
import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchBar({ value, onChange, placeholder, className }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border pl-10 pr-4 py-2"
      />
    </div>
  )
}
```

## Testing

All components should have test files:

```
components/common/search-bar.tsx
components/common/__tests__/search-bar.test.tsx
```
