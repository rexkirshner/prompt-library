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

## Active Decisions

| ID   | Title                              | Date       | Status      |
| ---- | ---------------------------------- | ---------- | ----------- |
| D001 | PostgreSQL over MongoDB            | 2025-01-15 | ✅ Accepted |
| D002 | Email/Password Auth over Google    | 2025-11-23 | ✅ Accepted |

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
