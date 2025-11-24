# lib/auth

Authentication module using NextAuth.js v5 with email/password credentials.

## Purpose

This module handles all authentication concerns for the application:
- User sign-in/sign-out via email and password
- Session management using JWT tokens
- Authorization (admin vs regular user)
- Auth utility functions for server components
- Secure password hashing with bcrypt

## Architecture

**Session Strategy**: JWT tokens (not database sessions)
- JWTs stored as HTTP-only cookies
- 30-day session lifetime
- Required for Credentials provider

**Provider**: Email/Password (Credentials provider)
- Passwords hashed with bcrypt (12 salt rounds)
- User lookup by email
- Secure password verification

## Files

- `config.ts` - NextAuth configuration with callbacks and provider setup
- `index.ts` - Main exports for the auth module
- `types.ts` - TypeScript type extensions for NextAuth
- `utils.ts` - Helper functions for common auth tasks (requireAuth, etc.)
- `password.ts` - Password hashing and verification utilities
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

// Sign in with email/password
export async function handleSignIn(email: string, password: string) {
  'use server'
  await signIn('credentials', {
    email,
    password,
    redirectTo: '/dashboard',
  })
}

// Sign out
export async function handleSignOut() {
  'use server'
  await signOut({ redirectTo: '/' })
}
```

### Creating New Users

```typescript
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/db/client'

export async function createUser(email: string, password: string, name: string) {
  'use server'

  // Hash the password
  const hashedPassword = await hashPassword(password)

  // Create user in database
  const user = await prisma.users.create({
    data: {
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      name,
    },
  })

  return user
}
```

## Configuration

Environment variables required in `.env.local`:

```env
# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>
```

### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Copy the output to `NEXTAUTH_SECRET` in `.env.local`.

## Database Schema

The auth module uses the `users` model:

```prisma
model users {
  id            String    @id
  email         String    @unique
  password      String?   // Bcrypt hashed password
  name          String?
  image         String?
  is_admin      Boolean   @default(false)
  created_at    DateTime  @default(now())
  last_login_at DateTime?
  // ... relations
}
```

**Note:** The `Account`, `Session`, and `VerificationToken` models exist but are not used with JWT strategy.

## Callbacks

### signIn Callback

Updates `last_login_at` timestamp when user signs in.

### jwt Callback

Adds custom fields to JWT token:
- `token.id` - User ID from database
- `token.isAdmin` - Admin status from database

### session Callback

Adds custom fields from JWT to session object:
- `session.user.id` - User ID from token
- `session.user.isAdmin` - Admin status from token

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

- Passwords hashed with bcrypt (12 salt rounds)
- JWTs stored in HTTP-only cookies
- Session cookies are secure (HTTPS in production)
- CSRF protection built into NextAuth
- Rate limiting should be added at application level
- Password validation should be implemented in sign-up forms

## Testing

For testing authentication:

1. Create a test user with hashed password:
   ```typescript
   import { hashPassword } from '@/lib/auth'
   import { prisma } from '@/lib/db/client'

   const hashedPassword = await hashPassword('testpassword123')
   await prisma.users.create({
     data: {
       id: crypto.randomUUID(),
       email: 'test@example.com',
       password: hashedPassword,
       name: 'Test User',
     },
   })
   ```

2. Sign in with the test credentials
3. To make a user admin:
   ```sql
   UPDATE users SET is_admin = true WHERE email = 'test@example.com';
   ```

## Password Requirements

Recommended password requirements for sign-up forms:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (optional but recommended)

## Related Documentation

- [NextAuth.js v5 Docs](https://authjs.dev/)
- [Credentials Provider](https://authjs.dev/reference/core/providers/credentials)
- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
