# Deployment Guide

This document explains how database migrations and deployments work for this project.

## Overview

This project uses **automated database migrations** on every deployment to Vercel. Migrations run automatically before the build process, ensuring the database schema is always up-to-date with the code.

## How It Works

### Automatic Migrations on Vercel

When you deploy to Vercel:

1. **Dependencies install**: `npm install` runs
2. **Prisma generates client**: `postinstall` script runs `prisma generate`
3. **Migrations run**: `vercel-build` script runs `prisma migrate deploy`
4. **Application builds**: Next.js build completes
5. **Deployment goes live**: Application is deployed with up-to-date schema

### Migration Scripts

```json
{
  "vercel-build": "prisma migrate deploy && next build",
  "postinstall": "prisma generate",
  "db:migrate:deploy": "prisma migrate deploy"
}
```

**Key Scripts:**

- **`vercel-build`**: Custom Vercel build command that runs migrations first
- **`prisma migrate deploy`**: Production-safe migration command (no prompts, applies pending migrations)
- **`postinstall`**: Generates Prisma Client after install

## Migration Types

### Development Migrations (`db:migrate`)

```bash
npm run db:migrate
```

- Creates new migration files
- Prompts for migration name
- Updates database schema
- Use this when developing new features locally

### Production Migrations (`db:migrate:deploy`)

```bash
npm run db:migrate:deploy
```

- Applies pending migrations only
- No interactive prompts (CI/CD safe)
- Used automatically in `vercel-build`
- Can be run manually if needed

## Initial Deployment Setup

For the **first deployment** or when setting up a new environment:

### 1. Set Environment Variables in Vercel

Required variables:
```bash
DATABASE_URL=postgresql://...          # From Vercel Postgres
NEXTAUTH_URL=https://your-domain.com   # Your production URL
NEXTAUTH_SECRET=<random-secret>        # Generate with: openssl rand -base64 32
```

Optional variables:
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX  # Google Analytics
```

### 2. Run Initial Migration

**Option A: Push and let Vercel handle it** (Recommended)
```bash
git push origin main
```
The `vercel-build` script will automatically run migrations.

**Option B: Manual migration** (if database already exists)
```bash
# Export production DATABASE_URL from Vercel
DATABASE_URL="postgresql://..." npm run db:migrate:deploy
```

### 3. Verify Deployment

1. Check Vercel deployment logs for migration success
2. Visit your site to confirm it's working
3. Check database in Vercel Postgres dashboard

## Adding New Migrations

### Local Development

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npm run db:migrate
   # Enter migration name when prompted
   ```
3. **Test locally** to ensure migration works
4. **Commit migration files**:
   ```bash
   git add prisma/migrations
   git commit -m "Add migration: <description>"
   ```
5. **Push to GitHub**:
   ```bash
   git push origin main
   ```

### Automatic Deployment

When you push migrations to GitHub:

1. Vercel detects the change
2. Builds with `vercel-build` script
3. `prisma migrate deploy` applies your new migration
4. Application builds with updated schema
5. Deployment completes successfully

## Rollback Strategy

If a migration fails or causes issues:

### 1. Immediate Rollback

Revert to previous deployment in Vercel dashboard:
- Vercel → Deployments → Previous deployment → "Promote to Production"

### 2. Migration Reversal

If you need to reverse a migration:

```bash
# Create a new migration that reverses the changes
npm run db:migrate
# Manually write SQL to reverse previous migration
```

**Important**: Prisma doesn't support automatic rollbacks. You must create a new migration that reverses changes.

### 3. Database Backup

Always create a backup before risky migrations:

```bash
# In Vercel Postgres dashboard
# Data tab → Export → Download backup
```

## Troubleshooting

### "Table does not exist" Error

**Cause**: Migrations haven't run yet
**Solution**: Run migrations manually:
```bash
DATABASE_URL="<production-url>" npm run db:migrate:deploy
```

### Migration Fails During Build

**Cause**: Migration has syntax errors or schema conflict
**Solution**:
1. Check Vercel build logs for error details
2. Fix migration locally and test
3. Commit and redeploy

### Database Connection Errors

**Cause**: DATABASE_URL not set or incorrect
**Solution**: Verify environment variables in Vercel

## Best Practices

### ✅ Do

- Test migrations locally before pushing
- Commit migration files to version control
- Use descriptive migration names
- Back up database before risky changes
- Review migration SQL before deploying

### ❌ Don't

- Don't modify existing migration files after committing
- Don't skip testing migrations locally
- Don't run `prisma migrate dev` in production
- Don't delete migration files from version control
- Don't manually edit database schema (use migrations)

## Migration Safety

### Production-Safe Commands

- `prisma migrate deploy` ✅ (used in vercel-build)
- `prisma generate` ✅
- `prisma db push` ⚠️ (only for prototyping)

### Development-Only Commands

- `prisma migrate dev` ❌ (interactive, development only)
- `prisma migrate reset` ❌ (destructive, development only)
- `prisma db seed` ⚠️ (use carefully in production)

## Manual Migration Execution

If you need to run migrations manually against production:

```bash
# 1. Get DATABASE_URL from Vercel environment variables
# 2. Run migration:
DATABASE_URL="postgresql://user:pass@host/db" npm run db:migrate:deploy

# 3. Verify success:
DATABASE_URL="postgresql://user:pass@host/db" npx prisma db execute --sql "SELECT 1"
```

## Monitoring

### Check Migration Status

```bash
# View pending migrations
npx prisma migrate status

# View applied migrations
# Check prisma/_migrations table in database
```

### Vercel Build Logs

Monitor migrations in Vercel deployment logs:
1. Vercel dashboard → Deployments
2. Click on deployment
3. View "Build Logs" tab
4. Look for "prisma migrate deploy" output

## Architecture

```
Developer → Git Push → GitHub
                        ↓
                    Vercel Deploy
                        ↓
                npm install
                        ↓
                prisma generate
                        ↓
            prisma migrate deploy  ← Automated migrations
                        ↓
                  next build
                        ↓
                Production Live
```

## Support

If you encounter migration issues:

1. Check Vercel build logs
2. Verify environment variables
3. Test migration locally
4. Review Prisma documentation: https://www.prisma.io/docs/concepts/components/prisma-migrate

## Related Documentation

- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Vercel Deployment](https://vercel.com/docs/concepts/deployments/overview)
- [Database Schema](./prisma/schema.prisma)
- [Environment Variables](./.env.example)
