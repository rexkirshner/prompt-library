# Maintenance Mode Guide

**Status:** 🟡 Maintenance Mode (as of 2025-11-27, Session 16)

This guide helps you return to the Input Atlas project after a long hiatus. It provides context, priorities, and workflows to get back up to speed quickly.

## Quick Start (5 Minutes)

```bash
# 1. Read current status
cat context/STATUS.md

# 2. Review Session 16 details (most recent work)
# Open context/SESSIONS.md and scroll to Session 16

# 3. Set up environment
docker compose up -d                # Start PostgreSQL
npm install                         # Install dependencies
npm run test:db                     # Verify database connection
npm run dev -- -p 3001              # Start dev server on port 3001

# 4. Verify everything works
npm test                            # Run all 75 tests
npm run build                       # Verify production build

# 5. Open the app
open http://localhost:3001
```

## Project Overview

**What is Input Atlas?**

A lightweight web application for saving, sharing, and discovering AI prompts. Built with Next.js 16, React 19, TypeScript, and PostgreSQL. Emphasis on quality curation through manual moderation.

**Production:** https://prompt-library-alpha-inky.vercel.app/

**Key Features:**
- Compound Prompts v2.0 - Prompts composed of other prompts with recursive resolution
- Import/Export System - JSON-based prompt portability with validation
- Per-Prompt Copy Preferences - Customizable copy formatting per prompt
- Audit Logging - Comprehensive tracking of all database mutations
- Type-Safe Architecture - Strict TypeScript with comprehensive type definitions

## Current State (Session 16)

**Project Health: ✅ EXCELLENT**

- All critical and high-priority code quality issues resolved (Sessions 14-15)
- Type system clean and well-documented
- All tests passing (75 total)
- Production build verified
- Comprehensive documentation complete

**Recent Work (Sessions 14-16):**

**Session 14 (2025-11-26):** Comprehensive code review
- Identified 23 issues: 6 critical, 6 high, 2 medium, 2 low, 7 suggestions
- Created systematic tracking in artifacts/code-reviews/session-14-review.md

**Session 15 (2025-11-26):** Critical fixes
- Resolved all 6 critical priority issues
- Resolved all 6 high priority issues
- Focus on auth vulnerabilities, error handling, and edge cases

**Session 16 (2025-11-27):** Type system enhancement & maintenance prep
- Fixed M2: Type hierarchy inconsistency in BasePrompt
- Added optional title/slug fields for better debugging
- Fixed 17 test fixtures
- Prepared comprehensive maintenance mode documentation

**Outstanding Issues (Non-Blocking):**
- M1: Type safety for compound component relationships (Medium)
- L1: Test coverage for import/export service (Low)
- L2: Edge case handling for circular dependencies (Low)

See [artifacts/code-reviews/session-14-review.md](artifacts/code-reviews/session-14-review.md) for details.

## Architecture Highlights

### Core Systems

**1. Compound Prompts v2.0** (lib/compound-prompts/)
- Prompts composed of other prompts with recursive resolution
- Depth calculation and circular dependency detection
- Two-pass resolution algorithm for efficiency
- 55 comprehensive tests

**2. Import/Export System** (lib/import-export/)
- JSON-based data portability
- Two-pass import algorithm for compound prompts
- Comprehensive validation with Zod
- Duplicate handling strategies (skip/update/error)
- 20 comprehensive tests

**3. Audit System** (lib/audit/)
- Tracks all database mutations
- Records user, operation type, table, entity ID
- Used for security, compliance, and debugging
- Structured logging with JSON in production

**4. Authentication** (lib/auth/)
- NextAuth.js v5 with email/password
- Bcrypt password hashing (12 salt rounds)
- JWT sessions with HTTP-only cookies
- Admin role support

### Key Architectural Decisions

See [context/DECISIONS.md](context/DECISIONS.md) for all 10 documented decisions. Highlights:

**D010 (Session 16):** Optional metadata fields in BasePrompt
- **Decision:** Add optional title/slug to BasePrompt instead of creating new types
- **Why:** YAGNI principle - single type serves both minimal resolution and rich debugging
- **Trade-offs:** Simpler architecture, backward compatible, better error messages

**D009 (Session 15):** Two-pass import algorithm for compound prompts
- **Decision:** Pass 1 creates all prompts, Pass 2 creates relationships
- **Why:** Component prompts must exist before creating relationships
- **Trade-offs:** More complex but handles dependencies correctly

**D004 (Session 8):** Compound prompts v2.0 architecture
- **Decision:** Dedicated compound_prompt_components table with position ordering
- **Why:** More flexible than text-based composition, supports infinite nesting
- **Trade-offs:** More complex schema but much more powerful

## Documentation Map

**Start Here:**
1. **[context/STATUS.md](context/STATUS.md)** - Current status, priorities, next steps
2. **[context/SESSIONS.md](context/SESSIONS.md)** - Full session history (16 sessions) with mental models
3. **[README.md](README.md)** - Getting started, tech stack, features

**Deep Dives:**
- **[context/ARCHITECTURE.md](context/ARCHITECTURE.md)** - System architecture and patterns
- **[context/DECISIONS.md](context/DECISIONS.md)** - Architectural decisions and rationale
- **[artifacts/code-reviews/session-14-review.md](artifacts/code-reviews/session-14-review.md)** - Code quality tracking

**Module-Specific:**
- `lib/compound-prompts/README.md` - Compound prompts system
- `lib/import-export/README.md` - Import/export functionality
- `lib/auth/README.md` - Authentication system

## Common Workflows

### Running the Development Environment

```bash
# Start PostgreSQL (required)
docker compose up -d

# Verify database connection
npm run test:db

# Start dev server on port 3001
npm run dev -- -p 3001

# Run tests (all 75 should pass)
npm test

# Run specific test suite
npm test -- lib/compound-prompts
npm test -- lib/import-export
```

### Database Operations

```bash
# Create a new migration
npm run db:migrate:dev

# Apply migrations to production
npm run db:migrate:deploy

# Reset database (WARNING: deletes all data)
npm run db:reset

# Open Prisma Studio (database GUI)
npm run db:studio
```

### Code Quality

```bash
# TypeScript type checking
npx tsc --noEmit

# Linting
npm run lint

# Formatting
npm run format

# Production build test
npm run build
```

### Working on Outstanding Issues

**M1: Type safety for compound component relationships**
- Location: lib/compound-prompts/services/component-service.ts
- Issue: Component relationships not strongly typed
- Suggested fix: Create typed result objects for validation

**L1: Test coverage for import/export service**
- Location: lib/import-export/services/__tests__/
- Issue: Missing tests for edge cases
- Suggested fix: Add tests for error conditions, large imports

**L2: Edge case handling for circular dependencies**
- Location: lib/compound-prompts/services/resolution-service.ts
- Issue: Could handle circular deps more gracefully
- Suggested fix: Add better error messages with cycle path

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Start PostgreSQL if not running
docker compose up -d

# Check database connection
npm run test:db

# Reset database if corrupted
docker compose down -v
docker compose up -d
npm run db:migrate
```

### Test Failures

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific failing test
npm test -- --testNamePattern="test name pattern"

# Clear Jest cache
npm test -- --clearCache
```

### Build Failures

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check for missing dependencies
npm install

# Clear Next.js cache
rm -rf .next
npm run build
```

### Port Already in Use

```bash
# Find process on port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
npm run dev -- -p 3002
```

## Tech Stack Reference

**Core:**
- Next.js 16.0.3 with Turbopack (React framework)
- React 19 (UI library)
- TypeScript 5.x with strict mode (Type system)

**Database:**
- PostgreSQL 17 (Database)
- Prisma 7 (ORM and migrations)
- Docker (Local PostgreSQL container)

**Authentication:**
- NextAuth.js v5 (Auth framework)
- Bcrypt (Password hashing)
- JWT (Session tokens)

**Styling:**
- Tailwind CSS v4 (Utility-first CSS)
- CSS Modules (Component styles)

**Testing:**
- Jest (Test framework)
- React Testing Library (Component testing)
- 75 tests total (all passing)

**Deployment:**
- Vercel (Hosting and deployment)
- Vercel Postgres (Production database)
- Automatic deployments on push to main

## Next Steps When Returning

**Priority 1: Environment Setup** (Required)
1. Start Docker PostgreSQL: `docker compose up -d`
2. Install dependencies: `npm install`
3. Verify database: `npm run test:db`
4. Start dev server: `npm run dev -- -p 3001`
5. Run tests: `npm test`

**Priority 2: Review Outstanding Issues** (Optional)
- Review M1, L1, L2 in code review document
- Decide if any are worth addressing before new feature work
- All are low/medium priority and non-blocking

**Priority 3: Feature Development or Launch** (User Decision)
- Review PRD for Phase 4 features
- Consider deployment to production
- Plan additional UX enhancements
- User testing and feedback gathering

## Getting Help

**Documentation:**
- All documentation in `context/` directory
- Session history in `context/SESSIONS.md` (comprehensive mental models)
- Code reviews in `artifacts/code-reviews/`

**Code Understanding:**
- Module README files (lib/*/README.md)
- Inline JSDoc comments throughout codebase
- Test files show usage examples

**Debugging:**
- Structured logging in lib/logging/
- Console logs in development
- JSON logs in production

---

**Last Updated:** 2025-11-27 (Session 16)
**Next Update:** When returning from maintenance mode

Welcome back! The project is in excellent shape and ready for your return.
