# lib/auth

Authentication module using NextAuth.js v5 with Google OAuth.

## Purpose

This module handles all authentication concerns for the application:
- User sign-in/sign-out via Google OAuth
- Session management using database sessions
- Authorization (admin vs regular user)
- Auth utility functions for server components

## Architecture

**Session Strategy**: Database sessions (not JWT)
- Sessions stored in PostgreSQL via Prisma adapter
- 30-day session lifetime
- Automatic session refresh every 24 hours

**Provider**: Google OAuth only (for MVP)
- Configured with offline access for refresh tokens
- Requests user consent on each sign-in for security

## Files

- `config.ts` - NextAuth configuration with callbacks and provider setup
- `index.ts` - Main exports for the auth module
- `types.ts` - TypeScript type extensions for NextAuth
- `utils.ts` - Helper functions for common auth tasks
- `README.md` - This file

## Usage

### Server Components

```typescript
import { getCurrentUser, requireAuth, requireAdmin } from '@/lib/auth'

// Get current user (returns null if not authenticated)
export default async function ProfilePage() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>Please sign in</div>
  }

  return <div>Welcome, {user.name}!</div>
}

// Require authentication (redirects to sign-in if not authenticated)
export default async function DashboardPage() {
  const session = await requireAuth()

  // User is guaranteed to be authenticated here
  return <div>Dashboard for {session.user.email}</div>
}

// Require admin role (redirects if not admin)
export default async function AdminPage() {
  const session = await requireAdmin()

  // User is guaranteed to be an admin here
  return <div>Admin Panel</div>
}
```

### API Routes

```typescript
import { auth } from '@/lib/auth'

export async function GET() {
  const session = await auth()

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  return Response.json({ user: session.user })
}
```

### Sign In/Out

```typescript
import { signIn, signOut } from '@/lib/auth'

// Sign in with Google
export async function handleSignIn() {
  'use server'
  await signIn('google', { redirectTo: '/dashboard' })
}

// Sign out
export async function handleSignOut() {
  'use server'
  await signOut({ redirectTo: '/' })
}
```

## Configuration

Environment variables required in `.env.local`:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

### Getting Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://your-domain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env.local`

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

## Database Schema

The auth module uses these Prisma models:

- `Account` - OAuth provider accounts linked to users
- `Session` - Active user sessions
- `VerificationToken` - Email verification tokens (future use)
- `users` - User data with `is_admin` flag

## Callbacks

### signIn Callback

Updates `last_login_at` timestamp when user signs in.

### session Callback

Adds custom fields to session object:
- `session.user.id` - User ID from database
- `session.user.isAdmin` - Admin status from database

## Authorization

Two levels of authorization:

1. **Authenticated User**: Any signed-in user
   - Can submit prompts
   - Can suggest edits
   - Can view their own submissions

2. **Admin User**: Users with `is_admin = true` in database
   - All authenticated user permissions
   - Can approve/reject prompts
   - Can approve/reject edits
   - Can manage tags
   - Can view admin dashboard

## Security

- Sessions stored server-side in database
- OAuth tokens encrypted in database
- Session cookies are HTTP-only
- CSRF protection built into NextAuth
- Rate limiting should be added at application level

## Testing

For testing authentication:

1. Sign in with a real Google account in development
2. First sign-in creates user in database
3. To make a user admin:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'your@email.com';
   ```

## Related Documentation

- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Prisma Adapter](https://authjs.dev/reference/adapter/prisma)
- [Google Provider](https://authjs.dev/reference/core/providers/google)
