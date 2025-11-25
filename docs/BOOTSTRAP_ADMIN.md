# Bootstrap Admin User in Production

This document explains how to create the first admin user in a fresh production database using the bootstrap endpoint.

## When to Use This

Use the bootstrap endpoint when:
- Deploying to a new production environment with an empty database
- After a complete database reset/migration
- Setting up a new instance of the application

**Important:** This endpoint only works when the database has **zero users**. Once any user exists, it becomes permanently disabled for security.

## Prerequisites

- Production deployment is live
- Database is accessible and migrated
- No users exist in the database (user count = 0)

## Step-by-Step Instructions

### 1. Generate a Bootstrap Secret

```bash
openssl rand -base64 32
```

Copy the output - you'll need it for steps 2 and 4.

### 2. Add Secret to Vercel Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add a new variable:
   - **Name**: `BOOTSTRAP_SECRET`
   - **Value**: (paste the secret from step 1)
   - **Environment**: Production
4. Click **Save**

### 3. Deploy to Production

The endpoint is already deployed in the code. If you need to trigger a deployment:
- Push any commit to main branch, or
- Trigger a redeploy from Vercel dashboard

Wait for deployment to complete.

### 4. Run the Bootstrap Script

From your local terminal:

```bash
./scripts/bootstrap-production-admin.sh
```

The script will prompt you for:

| Prompt | Example | Notes |
|--------|---------|-------|
| Production URL | `https://prompt-library.vercel.app` | Your Vercel deployment URL (no trailing slash) |
| Bootstrap Secret | (output from step 1) | The secret you added to Vercel |
| Admin Email | `admin@example.com` | Valid email format required |
| Admin Password | `SecureP@ssw0rd` | Minimum 8 characters |
| Admin Name | `Site Administrator` | Display name |

### 5. Verify Success

On success, you'll see:
```
✅ Success! Admin user created.

You can now log in at:
https://prompt-library.vercel.app/auth/signin

Email: admin@example.com
```

### 6. Clean Up (Optional but Recommended)

After successfully creating the admin user:

1. **Delete the `BOOTSTRAP_SECRET` from Vercel**
   - Go to Settings → Environment Variables
   - Delete `BOOTSTRAP_SECRET`
   - The endpoint will return 503 if called without the secret

2. **The endpoint is already disabled**
   - Even with the secret, it returns 403 since users exist
   - No security risk to leave it in production

## Security Features

### Built-in Protections

1. **Zero-User Check** (Primary Security)
   ```typescript
   const userCount = await prisma.users.count()
   if (userCount > 0) {
     return NextResponse.json({
       error: 'Bootstrap not allowed - users already exist'
     }, { status: 403 })
   }
   ```
   - This check runs **before** any user creation
   - Once any user exists, endpoint becomes permanently disabled
   - Cannot be bypassed

2. **Secret Requirement**
   - Requires `BOOTSTRAP_SECRET` environment variable
   - 32-byte random string (256-bit entropy)
   - Secret verification happens before any database operations

3. **Input Validation**
   - Email format validation (regex)
   - Password strength (minimum 8 characters)
   - Required fields check

4. **No Information Leakage**
   - Generic error messages
   - Doesn't reveal whether secret is wrong vs other issues
   - Console logs on server only

### Why It's Safe to Keep

- ✅ Endpoint is self-disabling after first use
- ✅ No way to delete all users via API to re-enable it
- ✅ Secret is environment-based, not in code
- ✅ Even if secret leaks, cannot be exploited once users exist
- ✅ No direct database manipulation possible

## API Reference

### Endpoint

```
POST /api/admin/bootstrap
```

### Request Body

```json
{
  "secret": "your-bootstrap-secret-from-env",
  "email": "admin@example.com",
  "password": "secure-password",
  "name": "Admin Name"
}
```

### Success Response (201 Created)

```json
{
  "success": true,
  "message": "Admin user created successfully",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name",
    "is_admin": true
  }
}
```

### Error Responses

#### Missing Fields (400)
```json
{
  "error": "Missing required fields: secret, email, password, name"
}
```

#### Invalid Email (400)
```json
{
  "error": "Invalid email format"
}
```

#### Weak Password (400)
```json
{
  "error": "Password must be at least 8 characters"
}
```

#### Invalid Secret (403)
```json
{
  "error": "Invalid secret"
}
```

#### Users Already Exist (403)
```json
{
  "error": "Bootstrap not allowed - users already exist",
  "userCount": 5
}
```

#### Secret Not Configured (503)
```json
{
  "error": "Bootstrap not configured (BOOTSTRAP_SECRET not set)"
}
```

## Manual cURL Example

If you prefer not to use the script:

```bash
curl -X POST https://your-domain.vercel.app/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your-bootstrap-secret",
    "email": "admin@example.com",
    "password": "SecurePassword123",
    "name": "Administrator"
  }'
```

## Troubleshooting

### "Bootstrap not configured"
- Check that `BOOTSTRAP_SECRET` is set in Vercel environment variables
- Verify it's set for the Production environment
- Redeploy after adding the variable

### "Invalid secret"
- Ensure the secret matches exactly (no extra spaces/newlines)
- Check that you're using the same secret added to Vercel
- Secrets are case-sensitive

### "Bootstrap not allowed - users already exist"
- This is the expected behavior after the first admin is created
- Endpoint is working correctly but is now disabled
- To create another admin, use the existing admin panel
- For a fresh start, you'd need to reset the database (contact DevOps)

### "Can't reach database server"
- Check that database is running and accessible
- Verify `DATABASE_URL` is set correctly in Vercel
- Check database connection limits

### "Failed with HTTP 500"
- Check Vercel function logs for detailed error
- Verify database schema is up to date (migrations applied)
- Ensure bcryptjs is installed in production dependencies

## After Bootstrap: What's Next?

Once you have an admin user:

1. **Log in** to the admin panel
2. **Import seed data** via `/admin/prompts/import`
   - Upload `prompts-seed-data.json`
   - Review and confirm import
3. **Create additional admins** via admin panel if needed
4. **Configure other settings** as needed

## Related Files

- **Endpoint**: `app/api/admin/bootstrap/route.ts`
- **Helper Script**: `scripts/bootstrap-production-admin.sh`
- **Seed Data**: `prompts-seed-data.json`
- **Environment Example**: `.env.example`

## Development Usage

For local development, you can also use the bootstrap endpoint:

```bash
# In .env.local, add:
BOOTSTRAP_SECRET="dev-secret-key"

# Then call the endpoint on localhost:
curl -X POST http://localhost:3001/api/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "dev-secret-key",
    "email": "admin@localhost",
    "password": "password123",
    "name": "Dev Admin"
  }'
```

Or use the existing `scripts/create-first-admin.ts` which is designed for development.
