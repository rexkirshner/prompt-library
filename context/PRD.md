# Product Requirements Document: AI Prompts Library v2

**Last Updated:** 2025-11-23
**Current Phase:** Phase 1 - MVP Core (Starting)
**Production URL:** https://prompt-library-alpha-inky.vercel.app/

## Progress Log

### Session 1 | 2025-11-23 | Phase 0 Foundation - COMPLETE

**Completed:**

- ✅ Next.js 16 project initialized with TypeScript, App Router, React 19
- ✅ Testing infrastructure (Jest + React Testing Library) - 22/22 tests passing
- ✅ Code quality tooling (ESLint + Prettier)
- ✅ Modular architecture (lib, components, types, modules)
- ✅ Simple branded homepage deployed to Vercel
- ✅ Production deployment working
- ✅ Docker Compose setup with PostgreSQL 17
- ✅ Prisma ORM 7 configured with PostgreSQL adapter
- ✅ Database schema implemented (9 models total including NextAuth tables)
- ✅ Initial database migration successful
- ✅ Database connection verified with test script
- ✅ NextAuth.js v5 implemented with Google OAuth
- ✅ Authentication module with utilities (requireAuth, requireAdmin, etc.)
- ✅ Database sessions with Prisma adapter
- ✅ Custom auth callbacks for last_login_at and isAdmin fields
- ✅ Comprehensive auth documentation (lib/auth/README.md)

**Next Steps (Phase 1):**

- Build prompt submission form
- Implement admin moderation dashboard
- Create prompt listing and detail pages

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

- **Frontend & Backend**: Next.js 14+ (App Router) with React
- **Database**: PostgreSQL (Vercel Postgres recommended for simplicity)
- **Authentication**: NextAuth.js (Google OAuth only for MVP)
- **Deployment**: Vercel (leverages platform features for minimal ops)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Email**: Resend or similar for transactional emails (optional for MVP)

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
  email: String (unique)
  name: String
  image: String (avatar URL from OAuth)
  is_admin: Boolean (default: false)
  created_at: Timestamp
  last_login_at: Timestamp
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
- **Encryption**: HTTPS only, passwords never stored (OAuth only)
- **Privacy Policy**: Clear statement about CC0 content and data usage
- **Cookie Policy**: Session cookies only, no tracking
- **GDPR Compliance**:
  - Right to deletion (account and attributions)
  - Data export capability
  - Consent for email communications

## Implementation Roadmap

### Phase 0: Foundation (Week 1-2) - ✅ COMPLETE

**Goal**: Set up development environment and core infrastructure

- [x] Initialize Next.js project with TypeScript
- [x] Set up Vercel deployment pipeline
- [x] Create base UI components with Tailwind
- [x] Configure PostgreSQL database (Docker + local dev)
- [x] Set up Prisma ORM with initial schema
- [x] Implement NextAuth.js with Google OAuth

**Exit Criteria**: Dev environment working, auth functional, database connected ✅

**Progress:** 6/6 complete (100%)

### Phase 1: MVP Core (Week 3-5)

**Goal**: Basic submission and moderation flow

- [ ] Prompt submission form
- [ ] Admin moderation queue
- [ ] Public browse page (no search yet)
- [ ] Individual prompt pages
- [ ] Basic admin dashboard
- [ ] Seed with 10-20 quality prompts

**Exit Criteria**: Can submit, moderate, and display prompts

### Phase 2: Discovery Features (Week 6-7)

**Goal**: Make prompts findable

- [ ] Full-text search implementation
- [ ] Category and tag filtering
- [ ] Copy to clipboard functionality
- [ ] View and copy counters
- [ ] Homepage with featured prompts
- [ ] Pagination

**Exit Criteria**: Search returns relevant results, filters work

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

- Vercel (hosting, deployments)
- PostgreSQL database provider
- Google OAuth
- npm packages (Next.js, React, etc.)

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
