# DECISIONS.md

**Decision log** - WHY choices were made. **Critical for AI agent review and takeover.**

**For current status:** See `STATUS.md`
**For session history:** See `SESSIONS.md`

---

## Why This File Exists

AI agents reviewing your code need to understand:

- **WHY** you made certain technical choices
- What **constraints** influenced decisions
- What **alternatives** you considered and rejected
- What **tradeoffs** you accepted

This file captures the reasoning that isn't obvious from code alone.

---

## Decision Template

```markdown
## [Decision ID] - [Decision Title]

**Date:** [YYYY-MM-DD]
**Status:** Accepted / Superseded / Reconsidering
**Session:** [Session number]

### Context

[What problem are we solving? What constraints exist?]

### Decision

[What did we decide to do?]

### Rationale

[WHY did we choose this approach?]

**Key factors:**

- [Factor 1]
- [Factor 2]

### Alternatives Considered

1. **[Alternative 1]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why not: [Reason for rejection]

2. **[Alternative 2]**
   - Pros: [Benefits]
   - Cons: [Drawbacks]
   - Why not: [Reason for rejection]

### Tradeoffs Accepted

- ✅ [What we gain]
- ❌ [What we give up]

### Consequences

**Positive:**

- [Good outcome 1]
- [Good outcome 2]

**Negative:**

- [Limitation 1]
- [Limitation 2]

### When to Reconsider

[Under what conditions should we revisit this decision?]

**Triggers:**

- [Trigger 1]
- [Trigger 2]

### Related

- See: `SESSIONS.md` Session [N]
- See: `ARCHITECTURE.md` [Section]
- Related decisions: [IDs]

**For AI agents:** [Any additional context AI needs to understand this decision]

---
```

## Example Decision

## D001 - Use PostgreSQL over MongoDB

**Date:** 2025-01-15
**Status:** Accepted
**Session:** 3

### Context

Need to choose database for user data, posts, and relationships. Requirements:

- Complex queries (joins across user/post/comment tables)
- ACID guarantees for financial data
- Mature ecosystem with good TypeScript support

### Decision

Use PostgreSQL with Prisma ORM instead of MongoDB.

### Rationale

**Key factors:**

- Relational data model fits our use case (users, posts, comments, relationships)
- Need ACID transactions for payment processing
- Complex joins required for social graph queries
- Team has PostgreSQL experience

### Alternatives Considered

1. **MongoDB**
   - Pros: Flexible schema, horizontal scaling, good for rapid iteration
   - Cons: No ACID across collections, complex joins expensive, harder to model relationships
   - Why not: Our data is inherently relational, need strong consistency

2. **MySQL**
   - Pros: Mature, well-known, good performance
   - Cons: Less advanced features than PostgreSQL, weaker JSON support
   - Why not: PostgreSQL's JSONB and array types give us flexibility without losing structure

### Tradeoffs Accepted

- ✅ Strong consistency, ACID guarantees, excellent query capabilities
- ❌ Vertical scaling limitations, less flexible schema changes

### Consequences

**Positive:**

- Can enforce referential integrity at DB level
- Complex social graph queries are performant
- Prisma provides type-safe database access

**Negative:**

- Schema migrations require planning
- Horizontal scaling requires sharding (complex)

### When to Reconsider

**Triggers:**

- Scale beyond single PostgreSQL instance capacity (>10M users)
- Need multi-region writes with eventual consistency
- Data model becomes truly document-oriented

### Related

- See: `ARCHITECTURE.md` Database Layer
- See: `SESSIONS.md` Session 3

**For AI agents:** This decision prioritizes consistency and relational integrity over scaling flexibility. The team values strong typing and schema enforcement. If reviewing for scale optimization, consider read replicas before suggesting NoSQL alternatives.

---

## D002 - Email/Password Authentication over Google OAuth

**Date:** 2025-11-23
**Status:** Accepted
**Session:** 6

### Context

Need authentication for users to submit prompts and for admins to moderate. Initial plan was Google OAuth via NextAuth.js, but discovered that Google OAuth requires app verification/approval for production use. Project timeline doesn't allow for lengthy approval process.

### Decision

Use email/password authentication via NextAuth.js v5 Credentials provider with bcrypt password hashing instead of Google OAuth.

### Rationale

**Key factors:**

- Avoid Google OAuth verification process (can take weeks)
- Maintain control over authentication flow
- Simpler setup for MVP phase
- User owns their credentials directly
- Standard security practices with bcrypt hashing

### Alternatives Considered

1. **Google OAuth (Original Plan)**
   - Pros: Users don't need new password, familiar UX, no password management burden
   - Cons: Requires Google approval for production, adds external dependency, limits user base to Google account holders
   - Why not: Approval process would delay project timeline significantly

2. **Magic Link (Email-only)**
   - Pros: No password management, simpler for users, no password security concerns
   - Cons: Requires email infrastructure, more complex to implement, slower sign-in flow
   - Why not: Adds complexity and external dependencies (email service) for MVP

3. **NextAuth Database Sessions**
   - Pros: More secure than JWT, can revoke sessions server-side
   - Cons: Credentials provider doesn't support database sessions (NextAuth limitation)
   - Why not: Technical incompatibility with Credentials provider

### Tradeoffs Accepted

- ✅ Full control over authentication, no external approval needed, standard security practices
- ❌ Users must manage passwords, need password reset flow later, potential security burden

### Consequences

**Positive:**

- Project can move forward without delays
- Standard bcrypt implementation (12 salt rounds) provides strong security
- JWT sessions include custom fields (isAdmin) for authorization
- Complete control over authentication logic

**Negative:**

- Must build password reset flow in future (Phase 2+)
- Users must remember another password
- Password security responsibility on our implementation
- Email verification not included in MVP (should add later)

### When to Reconsider

**Triggers:**

- User complaints about password management
- Security incident related to passwords
- Need for SSO for enterprise customers
- Want to support multiple auth providers (Google + Email)
- Google approval process becomes feasible

**Possible future:** Add Google OAuth as *additional* option alongside email/password (NextAuth supports multiple providers). Users could then choose their preferred method.

### Related

- See: `SESSIONS.md` Session 6
- See: `lib/auth/README.md` for implementation details
- Related code: `lib/auth/config.ts`, `lib/auth/password.ts`

**For AI agents:** This decision prioritizes shipping speed over convenience features. The Credentials provider requires JWT sessions (not database sessions) - this is a technical constraint, not a choice. When adding future auth providers, NextAuth supports multiple providers simultaneously, so we can add Google OAuth later without removing email/password.

---

## D003 - Boolean Admin Flag over Role-Based System

**Date:** 2025-11-24
**Status:** Accepted
**Session:** 8

### Context

Need to implement admin authorization for content moderation. Two approaches considered:
1. Role-based system with enum (USER, ADMIN, MODERATOR, etc.)
2. Simple boolean `is_admin` flag

Project is small scale (<1K users) with only two permission levels needed: regular users and admins.

### Decision

Use simple boolean `is_admin` field instead of role-based permission system.

### Rationale

**Key factors:**

- Only two permission levels needed for MVP (user vs admin)
- Small user base doesn't require complex RBAC
- Simpler to implement and maintain
- Easier to reason about in queries and code
- Can migrate to roles later if needed
- YAGNI principle - don't build what we don't need yet

### Alternatives Considered

1. **Role Enum (USER, ADMIN, MODERATOR)**
   - Pros: More flexible, room for future growth, industry standard pattern
   - Cons: Over-engineering for current needs, more complex queries, harder to migrate from later
   - Why not: Don't need multiple permission levels now, premature optimization

2. **Permission Flags (can_moderate, can_delete, etc.)**
   - Pros: Maximum flexibility, fine-grained control
   - Cons: Way too complex for current scale, hard to maintain consistency
   - Why not: Massive over-engineering for simple needs

### Tradeoffs Accepted

- ✅ Simplicity, easy to understand, faster to implement, minimal complexity
- ❌ Less flexible if we need multiple admin tiers later, would require migration

### Consequences

**Positive:**

- Clean boolean checks: `user.is_admin === true`
- Simple Prisma schema: `is_admin Boolean @default(false)`
- Easy to understand for any developer
- Fast queries (indexed boolean)
- Straightforward authorization logic

**Negative:**

- If we need MODERATOR role later, requires schema migration
- Can't easily distinguish between admin levels (super admin vs regular admin)
- Permission granularity limited to all-or-nothing

### When to Reconsider

**Triggers:**

- Need for multiple admin permission levels (moderator, super admin, etc.)
- User base grows beyond 1K and needs more granular permissions
- Business requirements emerge for role-based access control
- Need to audit specific permission usage patterns

**Migration path if needed:**
1. Add `role` enum column to users table
2. Migrate existing `is_admin=true` users to `role='ADMIN'`
3. Migrate `is_admin=false` users to `role='USER'`
4. Update all authorization checks from `is_admin` to `role`
5. Remove `is_admin` column after migration complete

### Related

- See: `prisma/schema.prisma` line 103 (`is_admin Boolean`)
- See: `lib/auth/types.ts` (extends session with `isAdmin` boolean)
- See: `lib/auth/admin.ts` (admin authorization utilities)
- Related decisions: D002 (authentication method)

**For AI agents:** The field is named `is_admin` in the database schema (snake_case) but exposed as `isAdmin` in TypeScript types (camelCase). This is intentional for consistency with JavaScript naming conventions. All authorization checks should use the boolean pattern `user?.isAdmin === true`, not role comparisons.

---

## D004 - Invite-Only Registration over Public Signup

**Date:** 2025-01-24
**Status:** Accepted
**Session:** 9

### Context

Need to control community growth and maintain quality. Options:
1. Open public registration (anyone can sign up)
2. Invite-only system (existing members invite new users)
3. Manual approval (admin reviews each signup)

Project is small-scale (<1K users) with quality curation as core value. Want to prevent spam while enabling organic community growth.

### Decision

Implement invite-only registration system where admins generate one-time invite links. No public signup allowed.

### Rationale

**Key factors:**

- Quality over quantity - small, curated community
- Admin-controlled growth prevents spam
- One-time invite links prevent sharing/abuse
- Simple to implement and maintain
- Aligns with manual moderation philosophy

### Implementation Details

**Database Schema:**

```prisma
model invite_codes {
  id           String    @id @default(uuid())
  code         String    @unique @default(uuid())
  created_by   String    // Admin who created invite
  created_at   DateTime  @default(now())
  used_by      String?   @unique
  used_at      DateTime?
}
```

**User Tracking:**

- `users.invited_by` field links to inviter
- Enables invite chain tracking for moderation
- Cascade delete invites when admin deleted

**Invite Generation:**

- Only admins can generate invites
- No limits (admins are trusted)
- One-time use only (marked used on signup)
- UUID codes (unguessable)

**Bootstrap:**

- CLI script creates first admin account
- Bypasses invite requirement for initial setup
- `scripts/create-first-admin.ts`

### Alternatives Considered

1. **Public Registration**
   - Pros: Easy for users, no friction, fast growth
   - Cons: Spam risk, quality dilution, moderation burden
   - Why not: Contradicts quality-first philosophy

2. **Manual Approval**
   - Pros: Maximum control, no invite tracking needed
   - Cons: Slow, admin burden, poor UX (waiting for approval)
   - Why not: Creates bottleneck, discourages signups

3. **Multi-Use Invites**
   - Pros: Fewer links to manage, easier sharing
   - Cons: Abuse risk (link shared publicly), harder to track
   - Why not: One-time use prevents abuse, tracking is valuable

4. **All Users Can Invite**
   - Pros: Organic growth, community-driven
   - Cons: Potential abuse, quality control harder
   - Why not: Admin-only keeps control tight for small community

### Tradeoffs Accepted

- ✅ Quality control, spam prevention, controlled growth, simple implementation
- ❌ Slower growth, admin dependency for invites, extra step for new users

### Consequences

**Positive:**

- Spam-free community
- Known invite chains (moderation tool)
- Quality-focused growth
- Simple invite flow (just a URL)

**Negative:**

- Admins must actively generate invites
- Can't grow without admin involvement
- Friction for potential users (need invite link)
- Bootstrap process requires CLI access

### When to Reconsider

**Triggers:**

- Community wants faster growth (100+ signups/month)
- Admin invite generation becomes bottleneck
- Need for non-admin members to invite friends
- Spam/quality issues prove manageable with public signup

**Migration path if needed:**

1. Add `users.can_invite` boolean field
2. Allow non-admin trusted users to generate invites
3. Add invite quotas if needed (e.g., 5 invites per user)
4. Or: Remove invite requirement entirely, add email verification

### Related

- See: D002 (Email/Password Authentication)
- See: D003 (Boolean Admin Flag)
- Implementation: `prisma/schema.prisma` (invite_codes model)
- Implementation: `scripts/create-first-admin.ts` (bootstrap)
- Implementation: `app/admin/invites/` (invite generation UI)
- Implementation: `app/auth/signup/` (invite validation)

**For AI agents:** Invite codes use UUID for `code` field (unguessable). The `id` and `code` are separate - `id` is primary key, `code` is the shareable token. Signup URL format: `/auth/signup?invite=<code>`. Bootstrap script should use same password hashing as regular signup (`lib/auth/password.ts`).

---

## D005 - Standardize Branding to "AI Prompt Library" (Singular)

**Date:** 2025-11-26
**Status:** Accepted
**Session:** 14

### Context

The application had inconsistent branding across the codebase, using both "AI Prompts Library" (plural) and "AI Prompt Library" (singular) in different locations. This created:
- Inconsistent user experience
- Confusion in documentation
- Unprofessional appearance
- SEO inconsistency (multiple variations dilute search ranking)

The inconsistency spanned 20+ files including navigation, metadata, authentication pages, and documentation.

### Decision

Standardize on "AI Prompt Library" (singular "Prompt") across all files, documentation, and UI elements.

### Rationale

**Key factors:**

- **Grammatical correctness**: "Prompt Library" is the correct grammatical construction (like "Book Library", not "Books Library")
- **Industry standard**: Most software libraries use singular form (React Component Library, UI Pattern Library)
- **SEO consistency**: Single canonical name improves search engine optimization
- **Professional appearance**: Consistency signals quality and attention to detail
- **User clarity**: One clear brand name reduces confusion

### Alternatives Considered

1. **Use "AI Prompts Library" (plural)**
   - Pros: Emphasizes that library contains multiple prompts
   - Cons: Grammatically awkward, not industry standard
   - Why not: "Library" already implies collection, plural is redundant

2. **Use different names in different contexts**
   - Pros: Could tailor messaging to specific audiences
   - Cons: Confusing, unprofessional, bad for SEO
   - Why not: Consistency is more valuable than context-specific messaging

3. **Rebrand to entirely different name**
   - Pros: Opportunity to create unique brand identity
   - Cons: Significant effort, existing users already know current name
   - Why not: Current name is descriptive and appropriate, just needs consistency

### Tradeoffs Accepted

- ✅ Consistent professional branding, better SEO, clear identity
- ❌ No significant downsides - this was purely fixing an inconsistency

### Consequences

**Positive:**
- Unified brand identity across all touchpoints
- Improved SEO (single canonical name in all metadata)
- Professional, polished appearance
- Easier for users to remember and reference
- Consistent Open Graph and Twitter Card metadata

**Negative:**
- None - this was an unambiguous improvement

### Implementation

**Changed 20 files across the codebase:**

**UI Components:**
- `components/NavBarClient.tsx` - Navigation branding
- `components/Footer.tsx` - Footer branding

**Pages and Metadata:**
- `app/layout.tsx` - Site metadata, Open Graph, Twitter Cards
- `app/prompts/page.tsx` - Browse page title
- `app/submit/page.tsx` - Submit page metadata
- `app/auth/signin/page.tsx` - Sign-in page
- `app/auth/signup/page.tsx` - Sign-up page
- Plus 13 additional files

**Documentation:**
- `README.md`
- `context/CONTEXT.md`
- `context/STATUS.md`
- `prisma/README.md`
- And others

**Method:** Used systematic grep + sed approach:
```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.md" \) \
  -exec sed -i '' 's/AI Prompts Library/AI Prompt Library/g' {} \;
```

### When to Reconsider

**This decision should be reconsidered if:**
- Complete rebranding initiative (new name entirely)
- User research shows confusion with singular form (unlikely)
- Acquisition/merger requires name change

**Triggers:**
- Never - this is a permanent branding standard unless complete rebrand occurs

### Related

- See: `SESSIONS.md` Session 14
- Commit: 51446f4 - "Update branding from 'AI Prompts Library' to 'AI Prompt Library'"
- Related: All metadata files, Open Graph tags, site navigation

**For AI agents:** The canonical brand name is **"AI Prompt Library"** (singular). Use this exact form in:
- All user-facing text
- Metadata (title, og:title, twitter:title)
- Documentation
- Code comments referring to the application name
- README files
- Error messages and user communications

Never use "AI Prompts Library" (plural) or other variations. This is a hard standard.

---

## Active Decisions

| ID   | Title                              | Date       | Status      |
| ---- | ---------------------------------- | ---------- | ----------- |
| D001 | PostgreSQL over MongoDB            | 2025-01-15 | ✅ Accepted |
| D002 | Email/Password Auth over Google    | 2025-11-23 | ✅ Accepted |
| D003 | Boolean Admin Flag over Roles      | 2025-11-24 | ✅ Accepted |
| D004 | Invite-Only Registration           | 2025-01-24 | ✅ Accepted |
| D005 | Branding: "AI Prompt Library"      | 2025-11-26 | ✅ Accepted |

---

## Superseded Decisions

| ID  | Title | Date | Superseded By | Reason |
| --- | ----- | ---- | ------------- | ------ |
| -   | -     | -    | -             | -      |

---

## Guidelines for AI Agents

When reviewing this file:

1. **Respect the context** - Decisions were made with specific constraints
2. **Check for changes** - Have triggers occurred that warrant reconsideration?
3. **Understand tradeoffs** - Don't suggest alternatives without acknowledging accepted tradeoffs
4. **Consider evolution** - Projects evolve, early decisions may need revisiting
5. **Ask before suggesting reversals** - Major architectural changes need user approval

When taking over development:

1. Read ALL decisions before making architectural changes
2. Understand WHY current approach exists
3. Check "When to Reconsider" sections for current relevance
4. Respect constraints that may still apply
5. Document new decisions in same format
