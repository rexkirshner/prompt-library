# Product Requirements Document: AI Prompts Library

## Overview
A lightweight, public-facing web application for saving, sharing, and discovering AI prompts. The platform allows anyone to browse and submit prompts, with admin moderation controls to maintain quality.

## Goals
- Create a searchable, organized repository of useful AI prompts
- Enable community contributions while maintaining quality through moderation
- Provide a simple, fast user experience focused on discoverability
- Build a sustainable, low-maintenance platform with minimal operational overhead

## Non-Goals
- Complex social features (profiles, followers, messaging)
- Advanced analytics or usage tracking
- Multi-language support (initial version)
- Mobile native applications

## Tech Stack
- **Frontend & Backend**: Next.js 14+ (App Router) with React
- **Database**: PostgreSQL (Vercel Postgres or Supabase)
- **Authentication**: NextAuth.js (support Google, GitHub OAuth)
- **Deployment**: Vercel
- **Styling**: Tailwind CSS (recommended for rapid development)

## User Roles

### 1. Anonymous Visitor
- Browse all approved prompts
- Search prompts by keywords
- Filter by categories/tags
- Submit new prompts (requires moderation)
- Suggest improvements to existing prompts (requires moderation)

### 2. Authenticated User
- All visitor capabilities
- Track submission history
- Faster submission flow (pre-filled author info)
- All submissions require admin approval

### 3. Admin
- All user capabilities
- Approve/reject pending submissions
- Edit any prompt
- Delete prompts
- Manage categories/tags
- View moderation queue

## Core Features

### 1. Prompt Display & Discovery

#### Prompt Entry Structure
Each prompt contains:
- **Title** (required): Brief, descriptive name
- **Prompt Text** (required): The actual prompt content
- **Tags** (required): One or more category tags (e.g., "coding", "writing", "analysis")
- **Modifiers** (optional): Additional instructions or variations that can be applied to the base prompt
- **Metadata** (system-generated):
  - Submission date
  - Author (name/email or "Anonymous")
  - Status (pending/approved/rejected)
  - Last modified date

#### Browse & Search
- **Homepage**: Display recently approved prompts (grid or list view)
- **Search bar**: Real-time search across title, prompt text, tags, and modifiers
- **Filter by tags**: Click tags to filter prompt list
- **Tag cloud/navigation**: Show all available tags with counts

#### Prompt Detail View
- Full prompt text with copy-to-clipboard button
- Display all modifiers as optional add-ons
- Show tags as clickable filters
- "Suggest Improvement" button
- Share button (copy link)

### 2. Submission System

#### Submit New Prompt
Form fields:
- Title (text input, required)
- Prompt text (textarea, required, markdown support optional)
- Tags (multi-select or text input with autocomplete, required)
- Modifiers (repeatable text fields, optional)
- Author info (auto-filled if authenticated, optional for anonymous)

Workflow:
1. User fills form
2. Submission enters "pending" queue
3. Admin receives notification (optional: email, dashboard badge)
4. Admin reviews and approves/rejects
5. Approved prompts become publicly visible

#### Suggest Improvement
- Similar form to new submission, pre-populated with existing prompt data
- Clearly marked as "suggested edit" in moderation queue
- Admin can review changes side-by-side
- Can accept edits or keep original

### 3. Admin Moderation Dashboard

#### Moderation Queue
- List all pending submissions and suggested improvements
- Side-by-side view for suggested edits
- Quick actions: Approve, Reject, Edit & Approve
- Bulk actions (approve/reject multiple)
- Filter by type (new prompts vs. improvements)

#### Content Management
- Edit any prompt (title, text, tags, modifiers)
- Delete prompts with confirmation
- Manage tag taxonomy (rename, merge, delete tags)

#### Admin Settings
- Manage admin users (add/remove admin role)
- Configure site settings (site name, description, etc.)

### 4. Authentication

#### Supported Methods
- Google OAuth
- GitHub OAuth
- Email/Password (optional, simpler to start with OAuth only)

#### Authentication Flow
- "Sign In" button in header
- NextAuth.js handled OAuth flow
- Post-auth redirect to original page or homepage
- Admin status stored in user database table or NextAuth callback

## Data Models

### Prompt
```
id: UUID (primary key)
title: String (required)
prompt_text: Text (required)
tags: String[] (required, array of tag names)
modifiers: JSON[] (optional, array of {label, text} objects)
author_name: String (nullable)
author_email: String (nullable)
submitted_by_user_id: UUID (nullable, foreign key to User)
status: Enum ['pending', 'approved', 'rejected']
created_at: Timestamp
updated_at: Timestamp
approved_at: Timestamp (nullable)
approved_by_user_id: UUID (nullable, foreign key to User)
```

### User
```
id: UUID (primary key)
email: String (unique)
name: String
image: String (avatar URL)
is_admin: Boolean (default: false)
created_at: Timestamp
```

### SuggestedEdit
```
id: UUID (primary key)
prompt_id: UUID (foreign key to Prompt)
title: String
prompt_text: Text
tags: String[]
modifiers: JSON[]
suggested_by_user_id: UUID (nullable, foreign key to User)
suggested_by_name: String (nullable)
suggested_by_email: String (nullable)
status: Enum ['pending', 'approved', 'rejected']
created_at: Timestamp
reviewed_at: Timestamp (nullable)
reviewed_by_user_id: UUID (nullable, foreign key to User)
```

## UI/UX Considerations

### Design Principles
- **Minimalist**: Clean, focused interface without clutter
- **Fast**: Optimistic UI updates, minimal page loads
- **Accessible**: Keyboard navigation, screen reader support
- **Responsive**: Mobile-first design

### Key Pages
1. **Homepage** (`/`): Search bar + featured/recent prompts
2. **Browse** (`/prompts`): Full prompt list with filters
3. **Prompt Detail** (`/prompts/[id]`): Individual prompt view
4. **Submit** (`/submit`): New prompt submission form
5. **Admin Dashboard** (`/admin`): Moderation queue and settings
6. **My Submissions** (`/my-submissions`): User's submission history (authenticated)

### Performance
- Server-side rendering for SEO and initial load speed
- Implement pagination or infinite scroll for prompt lists
- Cache frequently accessed data
- Optimize database queries with proper indexing

## Security Considerations
- Rate limiting on submission endpoints to prevent spam
- Input sanitization to prevent XSS attacks
- SQL injection prevention via parameterized queries/ORM
- Admin-only API routes protected with middleware
- CSRF protection via NextAuth.js

## Success Metrics
- Number of approved prompts in library
- Submission volume (new prompts + improvements)
- Search usage and popular search terms
- User sign-ups
- Admin moderation time/efficiency

## Implementation Phases

### Phase 1: MVP (Core Functionality)
- Basic Next.js app with Tailwind CSS
- Database setup with initial schema
- NextAuth.js integration (Google OAuth only)
- Prompt CRUD operations
- Public browse/search interface
- Admin approval queue
- Basic responsive design

### Phase 2: Enhanced Discovery
- Advanced tag management
- Improved search (fuzzy matching, highlighting)
- Filter combinations
- Copy-to-clipboard with toast notifications
- Share functionality

### Phase 3: Quality of Life
- Email notifications for admins
- Better analytics/insights for admins
- Markdown support in prompts
- Prompt versioning/history
- Export functionality (JSON, CSV)

## Open Questions
- Should we support markdown in prompt text for formatting?
- Do we want any rate limiting on anonymous submissions?
- Should we display submission stats (e.g., "124 prompts contributed by community")?
- Do we want to track view counts or popularity metrics?

## Appendix

### Example Modifiers Format
```json
[
  {
    "label": "More detailed",
    "text": "Provide extensive detail and examples for each point"
  },
  {
    "label": "Concise version",
    "text": "Keep responses brief and to the point"
  }
]
```

These modifiers would be displayed as optional add-ons users can append to the base prompt.
