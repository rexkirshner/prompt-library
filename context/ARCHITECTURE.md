# ARCHITECTURE.md

**System architecture and design patterns** for the AI Prompt Library.

**For coding standards:** See `CODE_STYLE.md`
**For current status:** See `STATUS.md`
**For decisions:** See `DECISIONS.md`

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Application Architecture](#application-architecture)
4. [Database Design](#database-design)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Security Architecture](#security-architecture)
8. [Performance Considerations](#performance-considerations)

---

## System Overview

The AI Prompt Library is a community-driven platform for discovering and sharing AI prompts. Built with Next.js 14+ App Router, it provides a modern, type-safe, server-first architecture.

### Core Features

1. **Public Browsing:** Browse approved prompts by category and tags
2. **User Submissions:** Authenticated users submit prompts for review
3. **Admin Moderation:** Admin users approve/reject submissions
4. **Prompt Edits:** Community can suggest improvements to existing prompts
5. **Analytics:** Track views and copies per prompt

### Design Philosophy

- **Simplicity First:** Minimal abstractions, straightforward patterns
- **Type Safety:** TypeScript strict mode throughout
- **Server-First:** Leverage Server Components for performance
- **YAGNI:** Build features when needed, not speculatively

---

## Technology Stack

### Frontend

- **Framework:** Next.js 14+ (App Router)
- **React:** v19 with Server Components
- **TypeScript:** Strict mode enabled
- **Styling:** Tailwind CSS (utility-first)
- **UI Components:** Custom components (no external UI library)

### Backend

- **Server Actions:** Next.js native server actions for mutations
- **API Routes:** Minimal use, mostly for NextAuth
- **Authentication:** NextAuth.js v5 (email/password with bcrypt)
- **ORM:** Prisma 7 with PostgreSQL adapter

### Database

- **Database:** PostgreSQL 17
- **Connection:** pg (PostgreSQL driver) with connection pooling
- **Migrations:** Prisma Migrate
- **Schema:** Relational design with referential integrity

### Development Tools

- **Testing:** Jest + React Testing Library
- **Linting:** ESLint (Next.js config + TypeScript rules)
- **Type Checking:** TypeScript compiler
- **Version Control:** Git with AI Context System

---

## Application Architecture

### Next.js App Router Structure

```
app/
├── (auth)/              # Auth route group (shared layout)
│   ├── signin/          # Sign in page
│   └── signup/          # Sign up page
├── admin/               # Admin dashboard
│   ├── queue/           # Moderation queue
│   └── page.tsx         # Admin home
├── prompts/             # Public prompt browsing
│   ├── [slug]/          # Individual prompt detail
│   └── page.tsx         # Browse all prompts
├── submit/              # Prompt submission flow
│   ├── success/         # Success confirmation
│   ├── actions.ts       # Server actions
│   └── page.tsx         # Submission form
├── api/                 # API routes (minimal)
│   └── auth/            # NextAuth endpoints
├── layout.tsx           # Root layout
└── page.tsx             # Homepage
```

### Feature Organization

Each feature follows a consistent pattern:

```
feature/
├── page.tsx             # Server Component (route handler)
├── actions.ts           # Server Actions (mutations)
├── ComponentName.tsx    # Client Components
└── __tests__/           # Test files
    └── *.test.tsx
```

### Shared Code Organization

```
lib/
├── auth/                # Authentication utilities
│   ├── config.ts        # NextAuth config
│   ├── password.ts      # Bcrypt utilities
│   ├── index.ts         # Auth helpers (getCurrentUser, etc.)
│   └── types.ts         # Auth types
├── db/                  # Database client
│   └── client.ts        # Prisma singleton with pooling
└── prompts/             # Prompt-specific logic
    ├── validation.ts    # Input validation
    └── __tests__/       # Validation tests

components/
├── ui/                  # Reusable UI components
└── forms/               # Form components
```

---

## Database Design

### Entity-Relationship Overview

```
users ──┬── prompts (submitted_by)
        ├── prompts (approved_by)
        ├── prompt_edits (suggested_by)
        ├── prompt_edits (reviewed_by)
        └── admin_actions

prompts ──┬── prompt_tags ──── tags
          └── prompt_edits

tags ──── prompt_tags ──── prompts
```

### Core Tables

#### users
Primary user table with authentication and authorization.

```sql
users {
  id              UUID PRIMARY KEY
  email           VARCHAR UNIQUE NOT NULL
  password_hash   VARCHAR
  name            VARCHAR
  is_admin        BOOLEAN DEFAULT false
  created_at      TIMESTAMP DEFAULT now()
  last_login_at   TIMESTAMP
}
```

**Indexes:**
- `email` (unique)
- Managed by NextAuth adapter

**Key fields:**
- `is_admin`: Simple boolean flag for admin permissions (see DECISIONS.md D003)
- `password_hash`: Bcrypt hash with 12 salt rounds

#### prompts
Main content table for AI prompts.

```sql
prompts {
  id                    UUID PRIMARY KEY
  slug                  VARCHAR UNIQUE NOT NULL
  title                 VARCHAR NOT NULL
  prompt_text           TEXT NOT NULL
  description           TEXT
  example_output        TEXT
  category              VARCHAR NOT NULL
  author_name           VARCHAR NOT NULL
  author_url            VARCHAR
  submitted_by_user_id  UUID REFERENCES users
  status                ENUM(PENDING, APPROVED, REJECTED)
  rejection_reason      TEXT
  featured              BOOLEAN DEFAULT false
  view_count            INTEGER DEFAULT 0
  copy_count            INTEGER DEFAULT 0
  created_at            TIMESTAMP DEFAULT now()
  updated_at            TIMESTAMP
  approved_at           TIMESTAMP
  approved_by_user_id   UUID REFERENCES users
  deleted_at            TIMESTAMP (soft delete)
}
```

**Indexes:**
- `slug` (unique)
- `(status, created_at)` - For moderation queue ordering
- `(status, featured, approved_at)` - For browse page with featured prompts

**Key fields:**
- `slug`: URL-safe identifier, generated from title with uniqueness guarantee
- `status`: Workflow state (PENDING → APPROVED/REJECTED)
- `featured`: Manual curation flag for homepage
- `deleted_at`: Soft delete timestamp (NULL = not deleted)

#### tags
Reusable tags for categorizing prompts.

```sql
tags {
  id           UUID PRIMARY KEY
  name         VARCHAR UNIQUE NOT NULL
  slug         VARCHAR UNIQUE NOT NULL
  usage_count  INTEGER DEFAULT 0
  created_at   TIMESTAMP DEFAULT now()
}
```

**Indexes:**
- `name` (unique)
- `slug` (unique)

**Key fields:**
- `usage_count`: Denormalized count for tag popularity

#### prompt_tags
Many-to-many junction table.

```sql
prompt_tags {
  prompt_id  UUID REFERENCES prompts ON DELETE CASCADE
  tag_id     UUID REFERENCES tags ON DELETE CASCADE
  PRIMARY KEY (prompt_id, tag_id)
}
```

**Cascade delete:** When prompt deleted, tags are automatically unlinked.

#### prompt_edits
Community suggestions for improving existing prompts.

```sql
prompt_edits {
  id                     UUID PRIMARY KEY
  prompt_id              UUID REFERENCES prompts
  title                  VARCHAR
  prompt_text            TEXT
  description            TEXT
  example_output         TEXT
  category               VARCHAR
  change_description     TEXT NOT NULL
  suggested_by_name      VARCHAR
  suggested_by_user_id   UUID REFERENCES users
  status                 ENUM(PENDING, APPROVED, REJECTED)
  rejection_reason       TEXT
  created_at             TIMESTAMP DEFAULT now()
  reviewed_at            TIMESTAMP
  reviewed_by_user_id    UUID REFERENCES users
}
```

**Indexes:**
- `(prompt_id, status)` - For filtering edits by prompt

#### admin_actions
Audit log for admin moderation actions.

```sql
admin_actions {
  id           UUID PRIMARY KEY
  user_id      UUID REFERENCES users
  action       VARCHAR NOT NULL
  target_type  VARCHAR NOT NULL (e.g., "prompt", "edit")
  target_id    UUID NOT NULL
  metadata     JSON
  created_at   TIMESTAMP DEFAULT now()
}
```

**Indexes:**
- `(target_type, target_id)` - For viewing action history per item
- `(user_id, created_at)` - For viewing admin activity

### Database Conventions

**Naming:**
- Tables: `snake_case`, plural (e.g., `prompts`, `users`)
- Columns: `snake_case` (e.g., `created_at`, `is_admin`)
- Foreign keys: `{table}_id` pattern (e.g., `user_id`, `prompt_id`)

**Timestamps:**
- Use `@default(now())` for creation timestamps
- Use manual updates for `updated_at` (via Prisma or application code)

**UUIDs:**
- All primary keys use UUID (via `crypto.randomUUID()`)
- Provides globally unique identifiers without collisions

---

## Authentication & Authorization

### Authentication Flow

```
1. User submits credentials (email + password)
   ↓
2. Server Action validates input
   ↓
3. Query database for user by email
   ↓
4. Verify password with bcrypt.compare()
   ↓
5. NextAuth creates JWT session token
   ↓
6. Update user.last_login_at timestamp
   ↓
7. Return session with custom fields (id, isAdmin)
```

### NextAuth Configuration

**Provider:** Credentials (email/password)
**Session:** JWT strategy (required for Credentials provider)
**Password Hashing:** bcrypt with 12 salt rounds

**Custom JWT Fields:**
- `id`: User UUID
- `isAdmin`: Boolean admin flag from database

**Session Lifetime:** 30 days

### Authorization Patterns

**Public Routes:**
```typescript
// No auth required
export default async function PromptsPage() {
  const prompts = await prisma.prompts.findMany({
    where: { status: 'APPROVED' }
  })
  return <div>{/* Render prompts */}</div>
}
```

**Authenticated Routes:**
```typescript
// Require valid session
export async function submitPrompt(data: FormData) {
  const user = await getCurrentUser()
  if (!user) {
    return { success: false, errors: { auth: 'Not authenticated' } }
  }
  // ... proceed
}
```

**Admin Routes:**
```typescript
// Require admin flag
export async function approvePrompt(id: string) {
  const user = await getCurrentUser()
  if (!user?.isAdmin) {
    return { success: false, errors: { auth: 'Unauthorized' } }
  }
  // ... proceed
}
```

### Security Principles

1. **Defense in Depth:** Validate at multiple layers (client, server, database)
2. **Least Privilege:** Users get minimum permissions needed
3. **Fail Secure:** Deny access on error or missing auth
4. **Audit Trail:** Log all admin actions to `admin_actions` table

---

## Data Flow Patterns

### Server Component Data Fetching

**Pattern:** Fetch data directly in Server Components

```typescript
// app/prompts/page.tsx
export default async function PromptsPage() {
  // Direct database query - no API needed
  const prompts = await prisma.prompts.findMany({
    where: { status: 'APPROVED' },
    orderBy: { approved_at: 'desc' },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      // Don't load full prompt_text for listing
    }
  })

  return <PromptList prompts={prompts} />
}
```

**Benefits:**
- No API endpoint needed
- Type-safe data fetching
- Automatic request deduplication
- Smaller bundle size (no client JS for data fetching)

### Server Actions for Mutations

**Pattern:** Use Server Actions for all mutations

```typescript
// app/submit/actions.ts
'use server'

export async function submitPrompt(data: FormData) {
  // 1. Authenticate
  const user = await getCurrentUser()
  if (!user) return { success: false, errors: { auth: 'Not authenticated' } }

  // 2. Validate
  const validation = validatePromptSubmission(data)
  if (!validation.success) return { success: false, errors: validation.errors }

  // 3. Mutate
  const prompt = await prisma.prompts.create({
    data: {
      id: crypto.randomUUID(),
      slug: await generateUniqueSlug(data.title),
      title: data.title,
      // ... other fields
      status: 'PENDING',
      created_at: new Date(),
      updated_at: new Date(),
    }
  })

  // 4. Redirect or return
  redirect(`/submit/success?id=${prompt.id}`)
}
```

**Benefits:**
- Progressive enhancement (works without JS)
- Type-safe mutations
- No API boilerplate
- Automatic CSRF protection

### Client Component Interactivity

**Pattern:** Use Client Components sparingly for UI state

```typescript
// components/forms/TagInput.tsx
'use client'

export function TagInput() {
  const [tags, setTags] = useState<string[]>([])
  const [input, setInput] = useState('')

  const addTag = () => {
    if (input && tags.length < 5) {
      setTags([...tags, normalizeTag(input)])
      setInput('')
    }
  }

  return (
    <div>
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={addTag}>Add Tag</button>
      {tags.map(tag => <TagChip key={tag} tag={tag} />)}
    </div>
  )
}
```

**When to use Client Components:**
- Form state management
- Interactive UI (modals, dropdowns, tooltips)
- Browser APIs (localStorage, clipboard, geolocation)
- Real-time features (WebSockets, polling)

---

## Security Architecture

### Input Validation

**Multi-Layer Validation:**

1. **Client-side:** Immediate feedback (TypeScript, HTML5 validation)
2. **Server-side:** Authoritative validation (always required)
3. **Database-side:** Constraints and indexes

```typescript
// lib/prompts/validation.ts
export function validatePromptSubmission(data: PromptSubmissionData) {
  const errors: Record<string, string> = {}

  // Length checks
  if (data.title.length < 10) errors.title = 'Too short'
  if (data.promptText.length > 5000) errors.promptText = 'Too long'

  // Format checks
  if (data.tags.some(tag => !isValidTag(tag))) {
    errors.tags = 'Invalid tag format'
  }

  // URL validation with scheme whitelist
  if (data.authorUrl && !isValidUrl(data.authorUrl)) {
    errors.authorUrl = 'Invalid URL'
  }

  return { success: Object.keys(errors).length === 0, errors }
}
```

### XSS Prevention

**URL Scheme Validation:**
```typescript
const ALLOWED_URL_SCHEMES = ['http:', 'https:']

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol)
  } catch {
    return false
  }
}
```

Prevents attacks via:
- `javascript:` URLs (executes JS on click)
- `data:` URLs (can contain encoded scripts)
- `file:` URLs (local file access)

**Output Encoding:**
React automatically escapes content in JSX, preventing XSS in most cases.

### SQL Injection Prevention

**Prisma Parameterization:**
All queries use Prisma ORM with parameterized queries. SQL injection is not possible.

```typescript
// ✅ Safe: Prisma parameterizes automatically
await prisma.prompts.findMany({
  where: { title: { contains: userInput } }
})

// ❌ Never do this: Raw SQL with string interpolation
await prisma.$executeRawUnsafe(`SELECT * FROM prompts WHERE title LIKE '%${userInput}%'`)
```

### Password Security

**Bcrypt Hashing:**
```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12 // ~250ms per hash

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### Authentication Security

**JWT Tokens:**
- Signed with `NEXTAUTH_SECRET` (256-bit entropy required)
- 30-day expiration
- Stored in httpOnly cookies (not accessible via JavaScript)

**Session Security:**
- Tokens include user ID and admin flag
- Re-validate on every request via `getCurrentUser()`
- No sensitive data in JWT payload

---

## Performance Considerations

### Database Query Optimization

**Select Only Needed Fields:**
```typescript
// ✅ DO: Select specific fields
const prompts = await prisma.prompts.findMany({
  select: {
    id: true,
    title: true,
    slug: true,
    description: true,
  }
})

// ❌ DON'T: Load all fields
const prompts = await prisma.prompts.findMany()
```

**Use Indexes:**
All frequent query patterns have indexes:
- `prompts(slug)` - Lookup by slug
- `prompts(status, created_at)` - Moderation queue
- `prompts(status, featured, approved_at)` - Browse page

**Connection Pooling:**
```typescript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isDevelopment ? 5 : 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
```

### React Performance

**Server Components by Default:**
- No client JavaScript shipped for data fetching
- Reduces bundle size significantly

**Streaming & Suspense:**
```typescript
// Future optimization: Stream content incrementally
<Suspense fallback={<Loading />}>
  <PromptList />
</Suspense>
```

### Caching Strategy

**Current:** No caching (MVP phase)

**Future:**
- ISR (Incremental Static Regeneration) for prompt detail pages
- Revalidate on-demand via `revalidatePath()` after approval
- Cache tag list (rarely changes)

---

## Future Architecture Considerations

### Known Limitations

1. **No Pagination:** Browse page loads all approved prompts (will slow down at scale)
2. **No Rate Limiting:** Auth endpoints vulnerable to brute force
3. **No Caching:** Every request hits database
4. **No Email Verification:** Users can sign up with any email
5. **Soft Deletes Not Implemented:** `deleted_at` field exists but not used

### Scaling Path

**When user base grows beyond 1K users:**

1. **Add Pagination:**
   - Cursor-based pagination for prompts
   - 20-50 items per page

2. **Add Caching:**
   - ISR for static pages (60s revalidation)
   - Redis for session storage (if needed)

3. **Add Rate Limiting:**
   - Use `@upstash/ratelimit` with Vercel KV
   - 5 attempts/hour for signup
   - 10 attempts/hour for signin

4. **Optimize Queries:**
   - Add read replicas for heavy read load
   - Use connection pooling (PgBouncer)

5. **Consider CDN:**
   - Vercel Edge Network for static assets
   - Edge caching for public pages

---

## Related Documentation

- **Code Style:** See `CODE_STYLE.md` for coding standards
- **Decisions:** See `DECISIONS.md` for architectural choices
- **Known Issues:** See `KNOWN_ISSUES.md` for current limitations
- **Prisma Schema:** See `prisma/schema.prisma` for database schema
- **Auth README:** See `lib/auth/README.md` for authentication details

---

**Last Updated:** 2025-11-24 (Session 9)
