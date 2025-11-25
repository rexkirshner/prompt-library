# Invite System Module

**Purpose:** Implement invite-only registration to control community growth and maintain quality.

## Overview

This module provides a complete invite system where admins generate one-time invite links that new users must use to sign up. No public registration is allowed.

## Architecture

### Database Schema

```prisma
model invite_codes {
  id         String    @id @default(uuid())
  code       String    @unique @default(uuid())  // Shareable token
  created_by String                              // Admin who created it
  created_at DateTime  @default(now())
  used_by    String?   @unique                   // User who redeemed it
  used_at    DateTime?

  creator    users     @relation(...)
  redeemer   users?    @relation(...)
}

model users {
  invited_by String?                 // Who invited this user
  inviter    users?    @relation(...) // Self-referential
}
```

**Key Design Decisions:**

- `id` vs `code`: Separate primary key from shareable token for security
- `@default(uuid())`: Prisma auto-generates unguessable codes
- `used_by @unique`: One invite = one signup (enforced at DB level)
- `onDelete: Cascade`: Invites deleted when creator deleted
- `onDelete: SetNull`: Redemption preserved if redeemer deleted

### Module Structure

```
lib/invites/
├── types.ts        # TypeScript type definitions
├── validation.ts   # Invite code validation logic
├── actions.ts      # CRUD operations (create, redeem, list)
├── index.ts        # Main exports
└── README.md       # This file
```

## Usage

### 1. Bootstrap First Admin

Before anyone can sign up, create the first admin via CLI:

```bash
npm run admin:create-first
```

This prompts for email/password and creates an admin account directly in the database, bypassing the invite requirement.

### 2. Generate Invite Codes (Admin Only)

```typescript
import { createInviteCode } from "@/lib/invites";

// In admin API route/server action
const result = await createInviteCode(
  adminUserId,
  "https://example.com"
);

if (result.success) {
  console.log("Share this URL:", result.inviteUrl);
  // https://example.com/auth/signup?invite=abc-123-def-456
}
```

### 3. Validate Invite During Signup

```typescript
import { validateInviteCode } from "@/lib/invites";

// In signup flow
const validation = await validateInviteCode(inviteCodeFromURL);

if (!validation.valid) {
  return { error: validation.error };
}

// Proceed with user creation...
```

### 4. Redeem Invite After Signup

```typescript
import { redeemInviteCode } from "@/lib/invites";

// After creating user
const newUser = await prisma.users.create({
  data: {
    email,
    password: hashedPassword,
    invited_by: creatorId, // Link to inviter
  },
});

await redeemInviteCode(inviteCode, newUser.id);
```

### 5. View Invite History (Admin)

```typescript
import { getAllInvites, getInviteStats } from "@/lib/invites";

// Get all invites with usage info
const invites = await getAllInvites();

// Get aggregate statistics
const stats = await getInviteStats();
console.log(`${stats.used}/${stats.total} invites used`);
```

## Security Considerations

### UUID as Code

- Invite codes are UUIDs (128-bit, unguessable)
- Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Impossible to brute force or enumerate

### One-Time Use

- `used_by` field enforced as `@unique` at database level
- Attempting to use same code twice will fail with constraint error
- No race conditions (atomic database update)

### Admin-Only Creation

- No invite generation endpoints exposed to non-admins
- Authorization checks happen in API routes/server actions
- This module provides primitives; caller enforces auth

### Invite Chain Tracking

- `users.invited_by` creates a provenance chain
- Enables moderation: ban bad actor → see who they invited
- Useful for understanding community growth patterns

## Error Handling

### Validation Errors

```typescript
enum InviteValidationError {
  NOT_FOUND = "Invite code not found",
  ALREADY_USED = "Invite code has already been used",
  INVALID_FORMAT = "Invalid invite code format",
}
```

### Redemption Failures

- Database constraint violations (invite already used)
- User not found (shouldn't happen if called correctly)
- Network/database errors (transient)

**Best Practice:** Wrap redemption in a transaction with user creation:

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.users.create({ data: {...} });
  await tx.invite_codes.update({
    where: { code },
    data: { used_by: user.id, used_at: new Date() }
  });
});
```

## Testing

### Unit Tests

Test validation logic in isolation:

```typescript
describe("validateInviteCode", () => {
  it("rejects invalid UUID format", async () => {
    const result = await validateInviteCode("not-a-uuid");
    expect(result.valid).toBe(false);
    expect(result.error).toBe(InviteValidationError.INVALID_FORMAT);
  });

  it("rejects non-existent code", async () => {
    const result = await validateInviteCode(randomUUID());
    expect(result.valid).toBe(false);
    expect(result.error).toBe(InviteValidationError.NOT_FOUND);
  });

  it("rejects already-used code", async () => {
    // Create and use an invite
    const invite = await createTestInvite();
    await redeemInviteCode(invite.code, testUserId);

    // Try to use again
    const result = await validateInviteCode(invite.code);
    expect(result.valid).toBe(false);
    expect(result.error).toBe(InviteValidationError.ALREADY_USED);
  });
});
```

### Integration Tests

Test full signup flow with invites:

```typescript
describe("Invite-only signup", () => {
  it("prevents signup without invite", async () => {
    const response = await POST("/api/auth/signup", {
      email: "test@example.com",
      password: "password123",
    });
    expect(response.status).toBe(400);
    expect(response.error).toContain("invite");
  });

  it("allows signup with valid invite", async () => {
    const invite = await createInviteCode(adminId, baseUrl);
    const response = await POST("/api/auth/signup", {
      email: "test@example.com",
      password: "password123",
      inviteCode: invite.inviteCode,
    });
    expect(response.status).toBe(201);
  });
});
```

## Migration Guide

### For Existing Projects

If you already have users and want to add invite system:

1. **Run migration** - Adds `invite_codes` table and `users.invited_by`
2. **Backfill invites** - Optionally create retroactive invite records for existing users
3. **Update signup flow** - Add invite validation to signup
4. **Create admin UI** - Build `/admin/invites` page

### Backfill Script (Optional)

```typescript
// scripts/backfill-invites.ts
// Create retroactive invites for existing users

const adminUser = await prisma.users.findFirst({ where: { is_admin: true } });

for (const user of existingUsers) {
  const invite = await prisma.invite_codes.create({
    data: {
      created_by: adminUser.id,
      used_by: user.id,
      used_at: user.created_at,
    },
  });
}
```

## Future Enhancements

### Multi-Use Invites

Allow invites to be used N times:

```prisma
model invite_codes {
  max_uses   Int     @default(1)
  uses_count Int     @default(0)
  redemptions invite_redemptions[]
}

model invite_redemptions {
  invite_id String
  user_id   String
  redeemed_at DateTime
}
```

### Invite Expiration

Add expiration dates:

```prisma
model invite_codes {
  expires_at DateTime?
}
```

Then check expiration in `validateInviteCode()`.

### User-Generated Invites

Allow non-admin users to invite:

```prisma
model users {
  can_invite       Boolean @default(false)
  invite_quota     Int     @default(0)
  invites_remaining Int     @default(0)
}
```

## Related Files

- `prisma/schema.prisma` - Database models
- `scripts/create-first-admin.ts` - Bootstrap script
- `app/admin/invites/` - Admin UI (to be implemented)
- `app/auth/signup/` - Signup flow (to be updated)
- `context/DECISIONS.md` - D004 (Invite-Only Registration decision)

## Support

For questions or issues with the invite system, see:

- **Decision rationale:** `context/DECISIONS.md` (D004)
- **Database schema:** `prisma/schema.prisma`
- **Implementation examples:** This README
