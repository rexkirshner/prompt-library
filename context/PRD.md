# Product Requirements Document: AI Prompts Library v2

**Last Updated:** 2025-11-24
**Current Phase:** Phase 3 - Polish & Launch (Ready to Start)
**Production URL:** https://prompt-library-alpha-inky.vercel.app/

## Progress Log

### Sessions 1-6 | 2025-11-23 | Phase 0 Foundation - ✅ COMPLETE

**Completed:**

- ✅ Next.js 16 project initialized with TypeScript, App Router, React 19
- ✅ Testing infrastructure (Jest + React Testing Library) - 22/22 tests passing
- ✅ Code quality tooling (ESLint + Prettier)
- ✅ Modular architecture (lib/, components/, types/, modules/)
- ✅ Simple branded homepage deployed to Vercel
- ✅ Production deployment working
- ✅ Docker Compose setup with PostgreSQL 17
- ✅ Prisma ORM 7 configured with PostgreSQL adapter
- ✅ Database schema implemented (9 models total including NextAuth tables)
- ✅ Initial database migration successful (20251124020013_add_password_field)
- ✅ Database connection verified with test script
- ✅ NextAuth.js v5 implemented with email/password authentication
- ✅ Bcrypt password hashing (12 salt rounds) with lib/auth/password.ts
- ✅ JWT session strategy with custom callbacks (isAdmin, last_login_at)
- ✅ Authentication module with utilities (requireAuth, requireAdmin, etc.)
- ✅ Comprehensive auth documentation (lib/auth/README.md)
- ✅ Vercel build fixed with postinstall script for Prisma generation
- ✅ All code verified in production build

**Key Decision:** Switched from Google OAuth to email/password to avoid Google verification/approval delays (See DECISIONS.md D002)

### Session 7 | 2025-11-24 | Phase 1 Authentication UI - ✅ COMPLETE

**Completed:**

- ✅ Authentication validation module (lib/auth/validation.ts) - 20 tests passing
- ✅ Sign-up form with progressive enhancement (/auth/signup)
- ✅ Sign-in form with NextAuth integration (/auth/signin)
- ✅ Server actions for sign-up and sign-in
- ✅ Comprehensive authentication flow test script (npm run test:auth)
- ✅ End-to-end manual testing verified
- ✅ Fixed NEXTAUTH_URL port configuration issue

**Test Results:** All validation tests passing ✅, Auth flow tests passing ✅

### Session 7 (continued) | 2025-11-24 | Phase 1 Prompt Submission - ✅ COMPLETE

**Completed:**

- ✅ Prompt validation module (lib/prompts/validation.ts) - 38 tests passing
- ✅ Slug generation and tag normalization utilities
- ✅ Server actions for prompt submission (app/submit/actions.ts)
- ✅ Tag management system (create or link existing tags)
- ✅ Unique slug generation with collision handling
- ✅ Submission form UI with preview toggle (app/submit)
- ✅ Reusable TagInput component with validation
- ✅ Success page for submissions
- ✅ Database seed script with 2 quality prompts (npm run db:seed)

**Test Results:** 58 total tests passing (20 auth + 38 prompts) ✅
**Database:** 2 approved prompts, 10 tags

### Session 8 | 2025-11-24 | Phase 1 Browse & Admin - ✅ COMPLETE

**Completed:**

- ✅ Public prompt listing page (/prompts) with grid layout
- ✅ Individual prompt detail pages (/prompts/[slug]) with SEO metadata
- ✅ CopyButton component with clipboard API and feedback
- ✅ Fixed Next.js 15+ async params issue in dynamic routes
- ✅ Admin authorization utilities (lib/auth/admin.ts)
- ✅ Admin moderation queue (/admin/queue) with approve/reject actions
- ✅ ModerationActions client component with inline rejection form
- ✅ Admin dashboard (/admin) with stats and recent submissions table
- ✅ Server actions for prompt moderation with revalidation
- ✅ Admin management script (scripts/make-admin.ts, npm run admin:make)

**Key Features:**

- Browse page shows all approved prompts in responsive grid
- Detail pages auto-increment view count, display full content with tags
- Admin queue lists pending prompts (FIFO) with full preview
- Approve/reject actions with revalidation of affected pages
- Dashboard shows pending/approved/rejected counts and quick links
- Type-safe admin checks using session.isAdmin boolean

**Test Results:** TypeScript type-check passing ✅
**Phase 1 Status:** All MVP core features complete! 🎉

**Next Steps (Phase 2):**

- Implement search and filtering on browse page
- Add homepage with featured prompts
- Tag management for admins
- Email notifications for submissions
- Export functionality (JSON/CSV)

---

## Executive Summary

A lightweight, public-facing web application for saving, sharing, and discovering AI prompts. Built for a small community (<1K users) with emphasis on quality curation through manual moderation. All content is contributed under CC0 (Public Domain) license for maximum reusability.

## Goals & Success Metrics

### Primary Goals

- Create a high-quality, searchable repository of useful AI prompts
- Enable community contributions while maintaining quality through manual moderation
- Provide a simple, fast user experience focused on discoverability
- Build a sustainable, low-maintenance platform optimized for small community scale

### Non-Goals

- Complex social features (profiles, followers, messaging, comments)
- Advanced analytics or usage tracking beyond basic metrics
- Multi-language support (initial version)
- Mobile native applications
- Enterprise features or private collections
- Automated moderation or AI-powered content filtering

### Success Metrics

#### North Star Metrics

- **Content Growth**: 50+ approved prompts within first month, 200+ by month 6
- **Content Quality**: >80% submission approval rate (indicates community understands quality bar)
- **User Engagement**: 100+ weekly active visitors browsing prompts

#### Operational Metrics

- **Moderation Efficiency**: Review 100% of submissions within 72 hours
- **Site Performance**: Page load time <2 seconds on 3G connection
- **Uptime**: 99.5% availability (allows ~3.5 hours downtime/month)

#### Quality Indicators

- **Content Freshness**: >25% of prompts updated or added in last 90 days
- **Discovery Success**: >50% of searches result in prompt views
- **Community Participation**: 10+ unique contributors per month

## Tech Stack & Architecture

### Core Technologies

- **Frontend & Backend**: Next.js 16 (App Router) with React 19
- **Database**: PostgreSQL 17 (Docker local, Vercel Postgres production)
- **ORM**: Prisma 7 with @prisma/adapter-pg
- **Authentication**: NextAuth.js v5 (email/password with bcrypt)
- **Deployment**: Vercel (leverages platform features for minimal ops)
- **Styling**: Tailwind CSS v4
- **Email**: Resend or similar for transactional emails (Phase 2+)

### Architecture Decisions

- **Rendering Strategy**: Server-side rendering (SSR) for SEO with Incremental Static Regeneration (ISR) for approved prompt pages
- **Search**: PostgreSQL full-text search with GiST indexes (adequate for <10K prompts)
- **Caching**: Vercel's built-in caching + 5-minute ISR for prompt lists
- **File Storage**: Prompts text-only, no file attachments (reduces complexity)
- **Background Jobs**: None initially; admin notifications can be synchronous

### Development & Deployment

- **Environments**: Local development + Vercel preview branches + production
- **Database Migrations**: Prisma or Drizzle ORM for schema management
- **Monitoring**: Vercel Analytics (basic) + error tracking via console logs
- **Backups**: Rely on Vercel Postgres automated daily backups

## User Roles & Permissions

### 1. Anonymous Visitor

**Capabilities:**

- Browse all approved prompts
- Search prompts by keywords
- Filter by categories/tags
- View individual prompt details
- Copy prompts to clipboard
- Submit new prompts (requires moderation)

**Restrictions:**

- Cannot edit or delete prompts
- Cannot see pending submissions
- No submission history tracking

### 2. Authenticated User

**Capabilities:**

- All visitor capabilities
- Track own submission history
- See status of own submissions (pending/approved/rejected)
- Pre-filled author info on submissions

**Restrictions:**

- All submissions still require admin approval
- Cannot edit approved prompts (must submit as suggestion)
- Cannot delete own submissions once approved

### 3. Admin

**Capabilities:**

- All user capabilities
- Approve/reject/edit pending submissions
- Edit any approved prompt directly
- Delete any prompt (soft delete)
- Manage tag taxonomy
- View moderation queue and statistics
- Set featured/pinned prompts

## Core Features

### 1. Prompt Discovery

#### Prompt Structure

Each prompt contains:

**Required Fields:**

- **Title**: Concise, descriptive name (10-100 characters)
- **Prompt Text**: The actual prompt content (150-5000 characters)
- **Category**: Primary category from fixed list (e.g., "Writing", "Coding", "Analysis")
- **Tags**: 1-5 additional descriptive tags

**Optional Fields:**

- **Description**: Brief explanation of use case (up to 500 characters)
- **Example Output**: Sample of expected result (up to 1000 characters)

**System Fields:**

- **Slug**: Auto-generated from title for SEO-friendly URLs
- **Author Attribution**: Name (required for display even if anonymous)
- **Submission Date**: When originally submitted
- **Last Updated**: Most recent edit
- **View Count**: Simple page view counter
- **Copy Count**: Times copied to clipboard

#### Browse & Search Interface

**Homepage (`/`)**

- Hero section with search bar
- Featured prompts (admin-curated)
- Recent additions (last 10 approved)
- Popular categories with counts
- Total prompt count display

**Browse Page (`/prompts`)**

- Grid/list view toggle
- Real-time search filtering
- Category and tag filters (AND logic)
- Sort options: Newest, Most Viewed, Recently Updated
- Pagination (20 per page)

**Search Implementation**

- PostgreSQL full-text search across title, prompt text, description
- Instant results with debouncing (300ms)
- Search suggestions based on popular queries
- "No results" state with suggestions

#### Prompt Detail Page (`/prompts/[slug]`)

**Content Display:**

- Full prompt text in monospace font
- Copy button with confirmation toast
- Metadata sidebar (category, tags, dates, view count)
- Author attribution per CC0 terms

**Actions:**

- Copy to clipboard (tracked)
- Share via URL copy
- "Suggest Improvement" (opens pre-filled form)
- Report issue (email link to admin)

### 2. Content Submission

#### New Prompt Submission (`/submit`)

**Form Fields:**

1. **Title** (required)
   - Character count indicator
   - Slug preview

2. **Prompt Text** (required)
   - Large textarea with character count
   - Basic markdown support (bold, italic, code blocks)
   - Preview panel

3. **Category** (required)
   - Dropdown from fixed list

4. **Tags** (required)
   - Multi-select with autocomplete
   - Suggest new tag option

5. **Description** (optional)
   - Helper text about use cases

6. **Example Output** (optional)
   - Collapsible section

7. **Author Name** (required)
   - Pre-filled if authenticated
   - Stored but not linked to auth account

**Submission Flow:**

1. User fills form with client-side validation
2. Preview step showing formatted prompt
3. Consent to CC0 license checkbox
4. Submit to moderation queue
5. Confirmation page with reference number
6. Email notification if address provided (optional)

#### Improvement Suggestions

- Same form as new submission
- Pre-populated with existing prompt data
- Required "What's changed?" field
- Shows diff view in admin panel

### 3. Admin Moderation System

#### Moderation Dashboard (`/admin`)

**Queue Management:**

- Filterable list of pending items
- Type indicators (new vs. improvement)
- Submission timestamp and author
- Quick preview on hover
- Bulk selection for approval/rejection

**Review Interface:**

- Full prompt preview
- Edit capability before approval
- Rejection with reason (template messages)
- One-click approval
- History of previous submissions from same author

**Content Management:**

- Search and filter all prompts
- Inline editing of approved content
- Soft delete with restoration
- Set featured status
- View/manage tags

**Admin Tools:**

- Basic stats dashboard (submissions per day, approval rate)
- Tag management (rename, merge, delete unused)
- Export data as JSON/CSV
- Manage admin users (add/remove)

### 4. Content Licensing & Attribution

#### CC0 Implementation

- Clear notice on submission form
- Checkbox consent required
- Link to human-readable CC0 explanation
- Attribution still displayed as courtesy
- Terms of Service page explaining license

#### Attribution Display

- "Contributed by [Name]" on prompt pages
- Optional link to contributor's website
- No claims of endorsement

## Data Models

### Core Entities

#### Prompt

```typescript
{
  id: UUID (primary key)
  slug: String (unique, indexed)
  title: String (required)
  prompt_text: Text (required)
  description: String (optional)
  example_output: Text (optional)
  category: String (required)
  tags: String[] (via junction table)

  // Attribution
  author_name: String (required)
  author_url: String (optional)
  submitted_by_user_id: UUID (optional, FK to User)

  // Status
  status: Enum ['pending', 'approved', 'rejected']
  rejection_reason: String (optional)
  featured: Boolean (default: false)

  // Metadata
  view_count: Integer (default: 0)
  copy_count: Integer (default: 0)

  // Timestamps
  created_at: Timestamp
  updated_at: Timestamp
  approved_at: Timestamp (nullable)
  approved_by_user_id: UUID (nullable, FK to User)
  deleted_at: Timestamp (nullable, soft delete)
}
```

#### User

```typescript
{
  id: UUID (primary key)
  email: String (unique, required)
  password: String (bcrypt hashed, nullable for future OAuth support)
  name: String (nullable)
  image: String (nullable, avatar URL)
  is_admin: Boolean (default: false)
  created_at: Timestamp
  last_login_at: Timestamp (nullable)
}
```

#### Tag

```typescript
{
  id: UUID (primary key)
  name: String (unique)
  slug: String (unique, indexed)
  usage_count: Integer (computed)
  created_at: Timestamp
}
```

#### PromptTag (Junction Table)

```typescript
{
  prompt_id: UUID (FK to Prompt)
  tag_id: UUID (FK to Tag)
  PRIMARY KEY (prompt_id, tag_id)
}
```

#### PromptEdit (Suggested Improvements)

```typescript
{
  id: UUID (primary key)
  prompt_id: UUID (FK to Prompt)

  // Proposed changes
  title: String
  prompt_text: Text
  description: String
  example_output: Text
  category: String
  tags: String[]
  change_description: Text (what changed)

  // Attribution
  suggested_by_name: String
  suggested_by_user_id: UUID (optional, FK to User)

  // Status
  status: Enum ['pending', 'approved', 'rejected']
  rejection_reason: String (optional)

  // Timestamps
  created_at: Timestamp
  reviewed_at: Timestamp (nullable)
  reviewed_by_user_id: UUID (nullable, FK to User)
}
```

#### AdminAction (Audit Log)

```typescript
{
  id: UUID (primary key)
  user_id: UUID (FK to User)
  action: String (approve, reject, edit, delete, etc.)
  target_type: String (prompt, user, tag)
  target_id: UUID
  metadata: JSON (additional context)
  created_at: Timestamp
}
```

### Database Indexes

- `prompts.slug` - unique index for URL lookups
- `prompts.status, prompts.created_at` - for moderation queue
- `prompts.status, prompts.featured, prompts.approved_at` - for homepage queries
- Full-text search index on `prompts.title, prompts.prompt_text, prompts.description`

## UI/UX Specifications

### Design System

- **Typography**: System font stack with clear hierarchy
- **Colors**: Minimal palette (background, text, primary accent, success/error)
- **Spacing**: 8px grid system
- **Components**: Based on shadcn/ui for consistency

### Responsive Breakpoints

- Mobile: <640px (single column)
- Tablet: 640px-1024px (two columns for grid)
- Desktop: >1024px (three columns for grid, sidebars)

### Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- ARIA labels for buttons and form fields
- Focus indicators visible
- Color contrast ratios meeting standards
- Skip navigation links

### Performance Targets

- Lighthouse score >90 for all pages
- First Contentful Paint <1.5s
- Time to Interactive <3s
- Bundle size <200KB for initial load

## Security & Privacy

### Security Measures

- **Input Sanitization**: HTML stripped from all user inputs except markdown fields
- **Markdown Sanitization**: Using DOMPurify or similar for allowed markdown
- **SQL Injection Prevention**: Parameterized queries via ORM
- **Rate Limiting**:
  - Anonymous: 5 submissions per hour per IP
  - Authenticated: 20 submissions per hour
- **CSRF Protection**: Built into NextAuth.js
- **Security Headers**: Configured via next.config.js
  - Content Security Policy
  - X-Frame-Options
  - X-Content-Type-Options

### Privacy Considerations

- **Data Minimization**: Only collect necessary information
- **Encryption**: HTTPS only, passwords hashed with bcrypt (12 salt rounds)
- **Session Storage**: JWT tokens in HTTP-only cookies (not database sessions)
- **Privacy Policy**: Clear statement about CC0 content and data usage
- **Cookie Policy**: Session cookies only, no tracking
- **GDPR Compliance**:
  - Right to deletion (account and attributions)
  - Data export capability
  - Consent for email communications

## Implementation Roadmap

### Phase 0: Foundation (Week 1-2) - ✅ COMPLETE

**Goal**: Set up development environment and core infrastructure

- [x] Initialize Next.js 16 project with TypeScript and React 19
- [x] Set up Vercel deployment pipeline with production builds
- [x] Create base UI components with Tailwind CSS v4
- [x] Configure PostgreSQL 17 database (Docker local + Vercel Postgres production)
- [x] Set up Prisma 7 ORM with initial schema (9 models)
- [x] Implement NextAuth.js v5 with email/password authentication
- [x] Add bcrypt password hashing utilities
- [x] Implement JWT session strategy with custom callbacks
- [x] Create comprehensive auth module with utilities (requireAuth, requireAdmin)
- [x] Add testing infrastructure (Jest + React Testing Library, 22/22 passing)
- [x] Set up code quality tools (ESLint, Prettier)
- [x] Fix Vercel build issues (postinstall script for Prisma)
- [x] Deploy and verify production build

**Exit Criteria**: Dev environment working, auth functional, database connected ✅

**Progress:** 13/13 complete (100%)

### Session 9 | 2025-11-24 | Phase 1 Final Polish - ✅ COMPLETE

**Completed:**

- ✅ Fixed static rendering errors by forcing dynamic rendering on database pages
- ✅ Fixed make-admin.ts script to use correct schema (boolean is_admin)
- ✅ Added navigation links to homepage (Browse Prompts, Submit a Prompt)
- ✅ Created responsive navigation bar with dropdown menu
- ✅ Implemented login/logout toggle based on authentication state
- ✅ All pages now show consistent navigation

**Navigation Features:**
- Dropdown menu with "Browse Prompts", "Submit a Prompt", and "Login/Logout"
- Server component wrapper fetches auth state
- Client component handles dropdown interactivity
- Logout redirects to homepage
- Click outside to close dropdown

### Phase 1: MVP Core (Week 3-5) - ✅ COMPLETE

**Goal**: Basic submission and moderation flow

- [x] User sign-up form (/auth/signup) with validation
- [x] User sign-in form (/auth/signin) with NextAuth integration
- [x] Test authentication flow end-to-end
- [x] Prompt submission form (/submit) with markdown preview
- [x] Admin moderation queue (/admin/queue)
- [x] Public browse page (/prompts) - no search yet
- [x] Individual prompt pages (/prompts/[slug])
- [x] Basic admin dashboard (/admin)
- [x] Seed with 10-20 quality prompts
- [x] Navigation bar with login/logout functionality
- [x] Homepage with links to key pages

**Exit Criteria**: Users can sign up/in, submit prompts, admins can moderate, public can view approved prompts ✅

**Progress:** 11/11 complete (100%) 🎉

### Session 10 | 2025-11-24 | Phase 2 Discovery Features - ✅ COMPLETE

**Completed:**

- ✅ Search and filtering utilities with comprehensive tests (18 tests)
- ✅ Full-text search across title, prompt_text, and description
- ✅ Category filtering dropdown
- ✅ Tag filtering with chips (top 20 tags by usage)
- ✅ PromptFilters client component with debounced search
- ✅ Copy count tracking via server action
- ✅ Homepage redesign with featured and recent prompts
- ✅ Pagination component with smart page ranges
- ✅ URL-based state management (shareable search/filter URLs)

**Search & Filter Features:**
- Case-insensitive search with 300ms debounce
- All filters work together (AND logic)
- Results update without full page reload (React transitions)
- Context-aware empty states
- Loading indicators during transitions
- "Clear all filters" button

**Homepage Features:**
- Hero section with dynamic prompt count
- Featured prompts section (up to 3, only if any exist)
- Recent prompts section (latest 6)
- Responsive grid layouts
- Consistent card styling

**Pagination Features:**
- 20 items per page
- Previous/Next buttons
- Smart ellipsis handling for many pages
- Result count display
- Works with search and filters
- Mobile-responsive (hides page numbers on small screens)

**Test Results:** 95/95 tests passing ✅
**Phase 2 Status:** All discovery features complete! 🎉

### Phase 2: Discovery Features (Week 6-7) - ✅ COMPLETE

**Goal**: Make prompts findable

- [x] Full-text search implementation
- [x] Category and tag filtering
- [x] Copy to clipboard functionality (with tracking)
- [x] View and copy counters
- [x] Homepage with featured prompts
- [x] Pagination

**Exit Criteria**: Search returns relevant results, filters work ✅

**Progress:** 6/6 complete (100%) 🎉

### Phase 3: Polish & Launch (Week 8-9)

**Goal**: Production readiness

- [ ] Improvement suggestion flow
- [ ] Email notifications (optional)
- [ ] Privacy policy and terms
- [ ] Error pages and loading states
- [ ] Mobile responsive testing
- [ ] Performance optimization
- [ ] Basic monitoring setup

**Exit Criteria**: Site ready for public launch

### Phase 4: Post-Launch Iteration

**Based on user feedback:**

- Export functionality (JSON/CSV)
- Markdown preview in submission
- Advanced tag management
- Basic analytics dashboard
- Additional OAuth providers

## Open Questions Resolved

1. **Markdown Support**: Yes, CommonMark subset with server-side sanitization
2. **Rate Limiting**: 5 per hour for anonymous, 20 for authenticated users
3. **Submission Stats**: Display total count on homepage, detailed stats in admin
4. **View Counts**: Simple increment on page view, no unique visitor tracking
5. **Content License**: CC0 (Public Domain) for all submissions

## Operational Runbook

### Daily Tasks

- Check moderation queue (morning and evening)
- Review any error logs in Vercel dashboard

### Weekly Tasks

- Review submission metrics
- Clean up orphaned tags
- Check for needed prompt updates

### Incident Response

- **Site Down**: Check Vercel status, database connection
- **Spam Wave**: Temporarily disable anonymous submissions
- **Bad Content**: Soft delete immediately, review moderation criteria

### Backup & Recovery

- Automated daily backups via Vercel Postgres
- Monthly manual export of all data as JSON
- Document restoration process

## Dependencies & Risks

### External Dependencies

- Vercel (hosting, deployments, PostgreSQL)
- Docker (local PostgreSQL development)
- npm packages (Next.js, React, Prisma, NextAuth, bcrypt, etc.)
- No external OAuth providers (self-managed authentication)

### Risks & Mitigations

- **Risk**: Spam submissions overwhelming moderation
  - **Mitigation**: Rate limiting, ability to disable anonymous submissions
- **Risk**: Database costs growing with views/copies tracking
  - **Mitigation**: Implement caching, consider removing fine-grained tracking
- **Risk**: Copyright claims on prompts
  - **Mitigation**: Clear CC0 license, DMCA process documented

## Appendix

### Fixed Category List

- Writing & Content
- Coding & Development
- Analysis & Research
- Creative & Design
- Business & Marketing
- Education & Learning
- Personal Productivity

### Rejection Reason Templates

- "Too short or lacks detail"
- "Duplicate of existing prompt"
- "Contains inappropriate content"
- "Not a prompt (wrong content type)"
- "Quality below community standards"

### Example Prompt Format

```
Title: Code Review Assistant

Category: Coding & Development
Tags: code-review, best-practices, refactoring

Prompt Text:
Review the following code for potential improvements in terms of readability, performance, and best practices. Identify any bugs, suggest optimizations, and provide specific examples of how to refactor problematic sections.

[INSERT CODE HERE]

Focus on:
1. Code clarity and maintainability
2. Performance bottlenecks
3. Security vulnerabilities
4. Testing recommendations

Example Output:
Here's my review of your code:

**Potential Issues Found:**
1. Line 15: Possible null reference exception...
2. Lines 23-30: This loop could be optimized using...

[etc.]
```
