# Database Schema

This directory contains the Prisma schema and migrations for the AI Prompt Library.

## Schema Overview

The database schema is based on the PRD v2 data models (see `context/PRD.md`).

### Models

**User** - Authenticated users (OAuth)
- Admins can approve/reject prompts
- Regular users can submit prompts and suggestions

**Prompt** - User-submitted AI prompts
- Pending/Approved/Rejected status workflow
- Soft delete support
- View and copy count tracking
- Tags via many-to-many relationship

**Tag** - Categorization labels
- Unique name and slug
- Usage count tracking

**PromptTag** - Junction table for Prompt <-> Tag relationship

**PromptEdit** - Suggested improvements to prompts
- Similar review workflow as Prompts
- Tracks what changed

**AdminAction** - Audit log
- Tracks all admin actions
- JSON metadata for flexibility

### Indexes

Performance indexes based on query patterns:
- `prompts.slug` - URL lookups
- `prompts.status, created_at` - Moderation queue
- `prompts.status, featured, approved_at` - Homepage queries
- `tags.slug` - Tag lookups

## Setup Instructions

### 1. Create Database

For development, use Vercel Postgres:

```bash
# Option A: Via Vercel Dashboard
# 1. Go to your project on vercel.com
# 2. Storage → Create Database → Postgres
# 3. Copy the DATABASE_URL to .env

# Option B: Via CLI (when configured)
vercel postgres create
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and add your database URL:

```bash
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL
```

### 3. Run Migrations

```bash
# Create and apply migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 4. Seed Database (Optional)

```bash
# To be created
npm run db:seed
```

## Common Commands

```bash
# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## Schema Changes

When modifying the schema:

1. Update `schema.prisma`
2. Run `npx prisma format` to format the file
3. Run `npx prisma validate` to check for errors
4. Create migration: `npx prisma migrate dev --name descriptive_name`
5. Generate client: `npx prisma generate`
6. Update TypeScript types if needed
7. Commit both schema and migration files

## Testing

Database tests use a separate test database:

```bash
# Set in .env.test
DATABASE_URL="postgresql://..."

# Run tests
npm test
```

## Troubleshooting

**"Can't reach database server"**
- Check DATABASE_URL is correct
- Verify database is running
- Check network/firewall settings

**"Migration failed"**
- Check for schema conflicts
- Review migration SQL
- May need to reset: `npx prisma migrate reset`

**"Type errors after schema change"**
- Regenerate client: `npx prisma generate`
- Restart TypeScript server in IDE

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
