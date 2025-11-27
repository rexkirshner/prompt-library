# Input Atlas

A lightweight, public-facing web application for saving, sharing, and discovering AI prompts. Built for a small community with emphasis on quality curation through manual moderation.

**Production:** https://inputatlas.com/

**Status:** Phase 0 Complete - Phase 1 Starting (User authentication forms)

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

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
# Create .env.local with:
# - DATABASE_URL (local: postgresql://postgres:postgres@localhost:54320/prompt_library_dev)
# - NEXTAUTH_URL (local: http://localhost:3000)
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)

# 3. Start PostgreSQL
docker compose up -d

# 4. Run database migrations
npm run db:migrate

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

```bash
npm run dev           # Development server (port 3000)
npm test              # Run tests (Jest)
npm run build         # Production build
npm run db:migrate    # Run Prisma migrations
npm run test:db       # Test database connection
npm run lint          # Run ESLint
npm run format        # Format with Prettier
```

## Project Structure

```
prompt-library/
├── app/              # Next.js App Router (pages & API routes)
├── lib/              # Shared modules
│   ├── auth/         # Authentication (NextAuth.js)
│   └── db/           # Database client (Prisma)
├── components/       # React components
├── types/            # TypeScript types
├── prisma/           # Database schema & migrations
└── context/          # AI Context System documentation
```

## Documentation

For comprehensive project documentation, see the `context/` directory:

- **[context/STATUS.md](context/STATUS.md)** - Current status, active tasks, quick reference
- **[context/CONTEXT.md](context/CONTEXT.md)** - Project architecture and setup
- **[context/DECISIONS.md](context/DECISIONS.md)** - Technical decisions and rationale
- **[context/SESSIONS.md](context/SESSIONS.md)** - Development session history

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
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

Current test status: 22/22 tests passing

## Deployment

Automatically deployed to Vercel on push to `main` branch.

**Production URL:** https://inputatlas.com/

## Contributing

This is a personal project. For questions or suggestions, please open an issue.

## License

MIT
