# Input Atlas

A lightweight, public-facing web application for saving, sharing, and discovering AI prompts. Built for a small community with emphasis on quality curation through manual moderation.

**Production:** https://prompt-library-alpha-inky.vercel.app/

**Status:** 🟡 Maintenance Mode (as of 2025-11-27)

**Project Health:**
- ✅ All critical and high-priority code quality issues resolved
- ✅ Type system clean and well-documented
- ✅ All tests passing (75 total)
- ✅ Production build verified
- 🟡 3 low/medium priority issues remain (non-blocking)

See [context/STATUS.md](context/STATUS.md) for current state and return priorities.

## Tech Stack

- **Framework:** Next.js 16 with React 19 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL 17 (Docker local, Vercel Postgres production)
- **ORM:** Prisma 7
- **Authentication:** NextAuth.js v5 (email/password)
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+
- Docker (for local PostgreSQL)

### Returning from Maintenance Mode

When returning to this project after hiatus:

1. **Review project state:** Read [context/STATUS.md](context/STATUS.md) for current status and priorities
2. **Review recent work:** See [context/SESSIONS.md](context/SESSIONS.md) for Session 16 details
3. **Follow installation steps below** to set up local environment

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Create .env.local with:
# - DATABASE_URL (local: postgresql://postgres:postgres@localhost:54320/prompt_library_dev)
# - NEXTAUTH_URL (local: http://localhost:3001)
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)

# 3. Start PostgreSQL
docker compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Verify database connection
npm run test:db

# 6. Start development server (port 3001)
npm run dev -- -p 3001

# 7. Verify everything works
npm test
```

Open [http://localhost:3001](http://localhost:3001) to view the application.

## Available Scripts

```bash
npm run dev -- -p 3001  # Development server (port 3001)
npm test                # Run tests (Jest) - 75 tests
npm run build           # Production build
npm run db:migrate      # Run Prisma migrations
npm run test:db         # Test database connection
npm run lint            # Run ESLint
npm run format          # Format with Prettier
npm run db:studio       # Open Prisma Studio (database GUI)
```

## Key Features

- **Compound Prompts v2.0:** Prompts composed of other prompts with recursive resolution
- **Import/Export System:** JSON-based prompt portability with validation
- **Per-Prompt Copy Preferences:** Customizable copy formatting per prompt
- **Audit Logging:** Comprehensive tracking of all database mutations
- **Type-Safe Architecture:** Strict TypeScript with comprehensive type definitions
- **Full Test Coverage:** 75 tests across core functionality

## Project Structure

```
prompt-library/
├── app/                      # Next.js App Router (pages & API routes)
├── lib/                      # Shared modules
│   ├── auth/                 # Authentication (NextAuth.js)
│   ├── db/                   # Database client (Prisma)
│   ├── compound-prompts/     # Compound prompts v2.0 system
│   ├── import-export/        # Import/export functionality
│   ├── audit/                # Audit logging system
│   └── logging/              # Structured logging
├── components/               # React components
├── types/                    # TypeScript types
├── prisma/                   # Database schema & migrations
├── context/                  # AI Context System documentation
└── artifacts/                # Code reviews and analysis
    └── code-reviews/         # Session-based code quality tracking
```

## Documentation

This project uses the AI Context System v3.0 for comprehensive documentation:

**Core Documentation:**
- **[context/STATUS.md](context/STATUS.md)** - Current status, active tasks, maintenance mode guide
- **[context/SESSIONS.md](context/SESSIONS.md)** - Full session history with mental models (16 sessions documented)
- **[context/DECISIONS.md](context/DECISIONS.md)** - Architectural decisions and rationale (10 decisions documented)
- **[context/ARCHITECTURE.md](context/ARCHITECTURE.md)** - System architecture and patterns
- **[context/CONTEXT.md](context/CONTEXT.md)** - Project overview and setup

**Code Quality:**
- **[artifacts/code-reviews/session-14-review.md](artifacts/code-reviews/session-14-review.md)** - Comprehensive code review with issue tracking

**Maintenance Mode:**
- **[MAINTENANCE.md](MAINTENANCE.md)** - Quick start guide for returning to the project after hiatus
- **[ROADMAP.md](ROADMAP.md)** - Outstanding issues, deferred features, and future priorities

**When Returning:** Start with [MAINTENANCE.md](MAINTENANCE.md) for quick setup, or [STATUS.md](context/STATUS.md) for current state.

## Database

Local development uses PostgreSQL 17 running in Docker on port 54320.

```bash
# Start PostgreSQL
docker compose up -d

# Stop PostgreSQL
docker compose down

# View database in Prisma Studio
npm run db:studio
```

## Authentication

NextAuth.js v5 with email/password authentication. See [lib/auth/README.md](lib/auth/README.md) for implementation details.

**Key features:**
- Bcrypt password hashing (12 salt rounds)
- JWT sessions with HTTP-only cookies
- Admin role support
- Server-side auth utilities

## Testing

```bash
npm test              # Run all tests (75 total)
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

**Test Coverage:**
- ✅ Compound Prompts: 55 tests (resolution, depth calculation, circular dependencies)
- ✅ Import/Export: 20 tests (JSON validation, import service, export service)
- ✅ All tests passing (as of Session 16, 2025-11-27)

## Deployment

Automatically deployed to Vercel on push to `main` branch.

**Production URL:** https://prompt-library-alpha-inky.vercel.app/

**Deployment Status:**
- Latest deploy: All tests passing, production build verified
- See [context/STATUS.md](context/STATUS.md) for deployment notes

## Contributing

This is a personal project. For questions or suggestions, please open an issue.

## License

MIT
