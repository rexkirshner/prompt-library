# KNOWN_ISSUES.md

**Tracked limitations and issues** in the AI Prompts Library.

**For current status:** See `STATUS.md`
**For architecture:** See `ARCHITECTURE.md`
**For decisions:** See `DECISIONS.md`

---

## About This File

This file tracks known issues, limitations, and technical debt. It provides transparency about what works, what doesn't, and what's planned for future improvement.

**Status Legend:**
- 🔴 **Critical** - Fix before production
- 🟠 **High** - Fix soon, significant impact
- 🟡 **Medium** - Address when possible
- 🟢 **Low** - Nice to have
- ✅ **Fixed** - Issue resolved (kept for reference)

---

## Fixed Issues

### ✅ C1: Database Schema Field Naming (Fixed: Session 9)
**Severity:** Critical → Fixed
**Resolution:** Documented is_admin vs role decision in DECISIONS.md D003

The schema uses `is_admin Boolean` (simple flag) instead of a role-based system. This was an intentional simplicity choice following YAGNI principles. See DECISIONS.md D003 for full rationale.

### ✅ L1: Outdated .env.example (Fixed: Session 9)
**Severity:** Low → Fixed
**Resolution:** Removed Google OAuth references, updated to reflect email/password auth

The `.env.example` file now accurately reflects the current authentication method (email/password via NextAuth Credentials provider).

### ✅ M10: Infinite Loop Risk in Slug Generation (Fixed: Session 9)
**Severity:** Medium → Fixed
**Resolution:** Added MAX_SLUG_ATTEMPTS limit (100), randomness after 50 attempts

`generateUniqueSlug()` now has bounded retry logic and will throw an error if unable to generate a unique slug after 100 attempts.

Location: `app/submit/actions.ts:66-99`

### ✅ H7: Missing URL Scheme Validation (Fixed: Session 9)
**Severity:** High (Security) → Fixed
**Resolution:** Added ALLOWED_URL_SCHEMES whitelist to prevent XSS

`isValidUrl()` now only accepts `http:` and `https:` protocols, preventing attacks via `javascript:`, `data:`, `file:`, etc.

Location: `lib/prompts/validation.ts:57-70`
Tests: `lib/prompts/__tests__/validation.test.ts:31-47`

### ✅ M1: Database Connection Pool Not Configured (Fixed: Session 9)
**Severity:** Medium (Performance) → Fixed
**Resolution:** Added environment-based pool configuration

Connection pool now configured with:
- Development: 5 max connections
- Production: 20 max connections
- 30s idle timeout, 10s connection timeout
- Graceful shutdown support

Location: `lib/db/client.ts:17-29`

### ✅ H1: Missing Core Documentation (Fixed: Session 9)
**Severity:** High → Fixed
**Resolution:** Created CODE_STYLE.md, ARCHITECTURE.md, KNOWN_ISSUES.md

All three critical documentation files now exist and provide comprehensive context for developers and AI agents.

---

## Critical Issues (🔴 Fix Before Production)

### C2: Missing Email Verification
**Severity:** 🔴 Critical (Security)
**Impact:** Security vulnerability - users can create accounts without verifying email

**Description:**
Users can sign up and immediately use the application without verifying their email address. This allows:
- Spam account creation
- Email harvesting
- Impersonation risk
- No accountability for submissions

**Location:** `app/auth/signup/actions.ts:63-72`

**Noted in:** DECISIONS.md D002 line 234 (deferred to Phase 2+)

**Suggested Fix:**
1. Add `email_verified` boolean and `email_verified_at` timestamp to users table
2. Generate verification tokens (use NextAuth's VerificationToken model)
3. Send verification email on signup (requires email service like Resend)
4. Prevent sign-in until verified
5. Add resend verification link

**Effort:** 2-3 days (includes email service setup)

**Workaround:** Manual admin approval of all content provides some protection

---

## High Priority Issues (🟠 Fix Soon)

### H2: No Rate Limiting on Authentication
**Severity:** 🟠 High (Security)
**Impact:** Vulnerable to brute force attacks, spam account creation

**Description:**
Sign-up and sign-in endpoints have no rate limiting, allowing:
- Brute force password attacks
- Account enumeration
- Spam account creation
- DoS attacks

**Location:** `app/auth/signup/actions.ts`, `app/auth/signin/actions.ts`

**Suggested Fix:**
1. Add rate limiting middleware (use `@upstash/ratelimit` with Vercel KV)
2. Limit sign-up: 5 attempts per hour per IP
3. Limit sign-in: 10 attempts per hour per email
4. Return same error for valid/invalid emails to prevent enumeration
5. Add exponential backoff after failed attempts

**Effort:** 1-2 days

**Workaround:** Monitor signups manually, Vercel provides some DDoS protection

### H3: SQL Injection Lacks Defense-in-Depth
**Severity:** 🟠 High (Security)
**Impact:** Relies solely on Prisma for SQL injection protection

**Description:**
While Prisma parameterization prevents SQL injection, there's no explicit input validation before database queries. The `ensureTags()` function uses user input directly without validating format.

**Location:** `app/submit/actions.ts:39-41`

**Suggested Fix:**
1. Add explicit tag format validation before database queries
2. Validate slug matches pattern: `/^[a-z0-9-]+$/`
3. Reject malformed input early with clear error messages
4. Add integration test for edge cases (SQL special characters, unicode)

**Effort:** 2-4 hours

**Workaround:** Prisma ORM provides strong protection via parameterization

### H4: No CSRF Protection on Sensitive Actions
**Severity:** 🟠 High (Security)
**Impact:** Potential Cross-Site Request Forgery attacks

**Description:**
Server actions don't explicitly implement CSRF protection beyond Next.js defaults. Sensitive operations like admin approval/rejection could be vulnerable.

**Location:** All server actions (`app/*/actions.ts`)

**Suggested Fix:**
1. Research Next.js 16 Server Actions CSRF protections (POST-only by default)
2. For sensitive admin actions, add additional verification (re-enter password)
3. Consider custom CSRF tokens for state-changing admin operations
4. Document CSRF protection strategy

**Effort:** 1-2 days (research + implementation)

**Workaround:** Next.js Server Actions use POST-only by default, providing some protection

### H5: Timestamps Use Application Time
**Severity:** 🟠 High (Data Integrity)
**Impact:** Clock skew, timezone issues, harder debugging

**Description:**
Timestamps are set using JavaScript `new Date()` instead of database defaults. This causes:
- Clock skew issues between app servers
- Inconsistent timestamps in distributed systems
- Timezone conversion problems
- Harder to audit database directly

**Location:**
- `app/submit/actions.ts:115,133`
- `app/auth/signup/actions.ts:70`
- `lib/auth/config.ts:79`

**Suggested Fix:**
1. Remove explicit `created_at` and `updated_at` from create operations
2. Let Prisma use database defaults: `@default(now())` and `@updatedAt`
3. Update Prisma schema to use `@updatedAt` on `updated_at` fields
4. Makes timestamps authoritative from database

**Effort:** 2-3 hours

**Workaround:** Single-server deployment minimizes clock skew impact

### H6: No Logging/Monitoring Strategy
**Severity:** 🟠 High (Operations)
**Impact:** Unable to diagnose production issues, no observability

**Description:**
Error handling uses `console.error()` throughout:
- No aggregated logs
- No structured logging
- No error tracking/alerting
- Can't diagnose production issues effectively
- No performance monitoring

**Location:** Entire codebase

**Suggested Fix:**
1. Add structured logging library (Pino or Winston)
2. Integrate error tracking (Sentry recommended for Next.js)
3. Log contextual information (user ID, request ID, timestamp)
4. Add performance monitoring (Vercel Analytics available)
5. Create alerting rules for critical errors

**Effort:** 1-2 days

**Workaround:** Vercel deployment logs provide basic visibility

### H8: Weak Password Requirements
**Severity:** 🟠 High (Security)
**Impact:** Users can choose weak passwords, account compromise risk

**Description:**
Password requirements are minimal:
- 8 characters minimum
- 1 uppercase, 1 lowercase, 1 number
- No special character required
- No check against common passwords
- No pwned password check

**Location:** `lib/auth/validation.ts:28-35`

**Suggested Fix:**
1. Increase minimum length to 10-12 characters
2. Require at least one special character
3. Add check against common password list (top 10k passwords)
4. Consider haveibeenpwned.com API integration
5. Add password strength meter on signup form

**Effort:** 4-6 hours

**Workaround:** Bcrypt with 12 salt rounds provides strong hashing

---

## Medium Priority Issues (🟡 Address When Possible)

### M2: No Pagination on Browse Page
**Severity:** 🟡 Medium (Performance/UX)
**Impact:** Will become slow as database grows

**Description:**
Browse page (`/prompts`) fetches ALL approved prompts without pagination:
- No limit on query
- No offset handling
- Could fetch 1000+ prompts as database grows
- Slow page load and poor UX at scale

**Location:** `app/prompts/page.tsx:19-34`

**Suggested Fix:**
1. Add pagination with 20 prompts per page
2. Use cursor-based pagination (better than offset)
3. Add "Load More" button or infinite scroll
4. Index on (status, created_at) already exists ✓

**Effort:** 4-6 hours

**Current Scale:** Works fine for <100 prompts (MVP phase)

### M3: Prisma Queries Not Optimized
**Severity:** 🟡 Medium (Performance)
**Impact:** Unnecessary data transfer, slower queries

**Description:**
Queries select all fields when only subset needed:
- Browse page loads full `prompt_text` (not displayed)
- Dashboard loads user `password` field (never needed)
- Increases bandwidth and database load

**Location:**
- `app/prompts/page.tsx:19-34`
- `app/admin/page.tsx:27-40`

**Suggested Fix:**
1. Use `select` to fetch only needed fields
2. Browse page: select title, slug, description, category (not prompt_text)
3. Dashboard: select id, title, status, created_at, author_name only

**Effort:** 2-3 hours

**Current Impact:** Minor at current scale

### M4: No Caching Strategy
**Severity:** 🟡 Medium (Performance)
**Impact:** Unnecessary database load, slow response times

**Description:**
No caching implemented:
- Prompt listing regenerates on every request
- Detail pages regenerate on every request
- Tag lists fetched repeatedly
- No CDN caching headers

**Location:** Entire application

**Suggested Fix:**
1. Use Next.js ISR (Incremental Static Regeneration) for prompt pages
2. Revalidate every 60 seconds or on-demand via `revalidatePath()`
3. Cache tag list in memory or Redis
4. Add proper Cache-Control headers
5. Enable Vercel Edge Caching

**Effort:** 1 day

**Current Impact:** Acceptable for low-traffic MVP

### M5: Missing Accessibility Features
**Severity:** 🟡 Medium (Accessibility)
**Impact:** Unusable for users with disabilities, WCAG non-compliance

**Description:**
Accessibility issues throughout:
- No ARIA labels on interactive elements
- Focus management not handled
- No keyboard navigation hints
- Screen reader experience poor
- Color contrast not verified

**Location:**
- `components/TagInput.tsx:31-66`
- `app/admin/queue/ModerationActions.tsx:54-67`
- Form inputs missing labels

**Suggested Fix:**
1. Add proper ARIA labels to all inputs
2. Ensure keyboard navigation works (Tab, Enter, Esc)
3. Add skip links for screen readers
4. Test with screen reader (NVDA or VoiceOver)
5. Verify color contrast ratio (WCAG AA minimum 4.5:1)
6. Add focus visible styles

**Effort:** 1-2 days

**Workaround:** Semantic HTML provides basic accessibility

### M6: No SEO Optimization
**Severity:** 🟡 Medium (SEO)
**Impact:** Poor search engine visibility, low discoverability

**Description:**
Poor SEO implementation:
- No Open Graph tags
- No Twitter Card tags
- No canonical URLs
- No Schema.org StructuredData
- Missing meta descriptions on many pages
- No robots.txt or sitemap.xml

**Location:** Multiple pages

**Suggested Fix:**
1. Add Open Graph tags to all public pages
2. Add Twitter Card meta tags
3. Create sitemap.xml (dynamic from prompts table)
4. Add robots.txt
5. Implement Schema.org StructuredData for prompts
6. Add canonical URLs

**Effort:** 1-2 days

**Current Impact:** Low during MVP/beta phase

### M7: Inconsistent Error Messages
**Severity:** 🟡 Medium (UX)
**Impact:** Poor UX, harder to debug, support burden

**Description:**
Error messages are generic:
- "An unexpected error occurred" throughout
- No error codes
- Can't distinguish between failure types
- Users don't know what went wrong

**Location:** Throughout server actions

**Suggested Fix:**
1. Define error codes enum (DB_ERROR, VALIDATION_ERROR, AUTH_ERROR)
2. Return specific error messages based on error type
3. Log full error details server-side
4. Show user-friendly messages to users
5. Add retry hints where applicable

**Effort:** 3-4 hours

**Workaround:** Validation errors are specific and helpful

### M8: No Email Notifications
**Severity:** 🟡 Medium (UX)
**Impact:** Users don't know submission status

**Description:**
Users receive no email notifications for:
- Prompt approved
- Prompt rejected
- Account created
- Password reset (when implemented)

**Noted in:** DECISIONS.md D002 as Phase 2+ feature

**Suggested Fix:**
1. Integrate email service (Resend recommended for Next.js)
2. Create email templates
3. Send submission acknowledgment
4. Send approval/rejection notifications
5. Make notifications opt-in/opt-out

**Effort:** 2-3 days

**Workaround:** Users must check dashboard manually

### M9: Missing API Documentation
**Severity:** 🟡 Medium (Documentation)
**Impact:** Harder to integrate, harder to maintain

**Description:**
Server actions serve as API but aren't documented:
- No function signatures for external use
- No rate limits documented
- No error codes listed

**Suggested Fix:**
1. Create API.md documenting all server actions
2. List inputs, outputs, error codes
3. Add usage examples
4. Document rate limits when implemented
5. Consider OpenAPI/Swagger spec if exposing REST API

**Effort:** 3-4 hours

**Current Use:** Internal-only, not needed yet

### M11: No Admin Audit Log
**Severity:** 🟡 Medium (Security/Compliance)
**Impact:** Can't audit admin behavior, no accountability

**Description:**
No audit trail for admin actions:
- Who approved which prompt?
- Who rejected which prompt?
- When did actions occur?
- `admin_actions` table exists in schema but not used

**Location:** Schema line 9-21 (table exists, not implemented)

**Suggested Fix:**
1. Use existing `admin_actions` table
2. Log all admin actions (approve, reject, delete, make admin)
3. Store user_id, action, target_type, target_id, metadata
4. Create admin audit log view page

**Effort:** 4-6 hours

**Workaround:** Database timestamps show when records changed

### M12: Password Reset Flow Missing
**Severity:** 🟡 Medium (UX)
**Impact:** Users locked out if they forget password

**Description:**
Users cannot reset forgotten passwords:
- No "Forgot Password" link on sign-in page
- No password reset flow
- Permanently locked out if password forgotten

**Noted in:** DECISIONS.md D002 line 232 as Phase 2+

**Suggested Fix:**
1. Add "Forgot Password" link to `/auth/signin`
2. Create password reset request page
3. Generate reset tokens (use VerificationToken table)
4. Send reset email with token link
5. Create password reset confirmation page
6. Expire tokens after 1 hour

**Effort:** 1-2 days

**Workaround:** Admin can manually reset user passwords (not implemented)

---

## Low Priority Issues (🟢 Nice to Have)

### L2: Test Coverage Gaps
**Severity:** 🟢 Low (Testing)
**Impact:** Potential bugs in untested paths

**Description:**
While 81 unit tests pass, coverage gaps exist:
- No integration tests for authentication flow
- No E2E tests
- Server actions not directly tested
- Admin authorization not tested
- Database operations not tested with real DB

**Suggested Fix:**
1. Add integration tests using test database
2. Test complete signup → signin → submit → moderate flow
3. Add E2E tests with Playwright
4. Achieve 80%+ coverage

**Effort:** 2-3 days

**Current Coverage:** Strong unit test coverage for validation logic

### L3: Component Reusability Low
**Severity:** 🟢 Low (Code Quality)
**Impact:** Code duplication, inconsistent UX

**Description:**
Form components have similar patterns but aren't abstracted:
- SubmitPromptForm.tsx
- SignUpForm.tsx
- SignInForm.tsx
- ModerationActions.tsx

Each reimplements loading states, error display, form submission.

**Suggested Fix:**
1. Create shared form components (FormInput, FormTextarea, FormButton)
2. Create useFormState hook wrapper
3. Extract error display component

**Effort:** 1 day

**Current Impact:** Minor code duplication

### L4: No Dark Mode Support
**Severity:** 🟢 Low (UX)
**Impact:** Eye strain for users who prefer dark mode

**Description:**
Application only has light mode:
- No dark mode toggle
- No system preference detection
- Could strain eyes in dark environments

**Suggested Fix:**
1. Use Tailwind dark mode with 'class' strategy
2. Add dark: variants to all components
3. Create theme toggle button
4. Persist preference in localStorage
5. Respect system preference (prefers-color-scheme)

**Effort:** 1-2 days

**Current Impact:** Cosmetic only

### L5: Bundle Size Not Optimized
**Severity:** 🟢 Low (Performance)
**Impact:** Slower initial page loads

**Description:**
No bundle size analysis:
- Not tracking bundle size over time
- Unused dependencies might be included
- No code splitting strategy beyond defaults

**Suggested Fix:**
1. Add bundle analyzer: `@next/bundle-analyzer`
2. Check for unused dependencies
3. Consider dynamic imports for heavy components
4. Monitor bundle size in CI

**Effort:** 2-3 hours

**Current Impact:** Next.js provides good defaults

### L6: Docker Compose Incomplete
**Severity:** 🟢 Low (DevEx)
**Impact:** Inconsistent local development setup

**Description:**
Docker Compose exists but isn't fully integrated:
- Doesn't set DATABASE_URL automatically for app
- No service dependencies defined
- Local development flow not documented

**Location:** `docker-compose.yml`

**Suggested Fix:**
1. Add app service to docker-compose.yml
2. Define service dependencies
3. Auto-generate DATABASE_URL from Postgres service
4. Document Docker workflow in README

**Effort:** 1-2 hours

**Current Impact:** Minor developer experience issue

---

## Deferred Features (By Design)

These are intentionally not implemented in Phase 1 MVP:

### Email Verification
**Status:** Deferred to Phase 2+
**Rationale:** Requires email service setup, adds complexity
**Reference:** DECISIONS.md D002 line 234

### Password Reset Flow
**Status:** Deferred to Phase 2+
**Rationale:** MVP focused on core submission flow
**Reference:** DECISIONS.md D002 line 232

### Google OAuth
**Status:** Deferred (approval process too long)
**Rationale:** Email/password faster to implement, avoids Google approval
**Reference:** DECISIONS.md D002

### Role-Based Access Control
**Status:** Not needed yet (YAGNI)
**Rationale:** Only need admin vs user for MVP
**Reference:** DECISIONS.md D003

---

## Testing Status

**Test Suite:** 81 tests passing ✅

**Coverage:**
- ✅ Validation logic (comprehensive)
- ✅ URL scheme validation (XSS prevention)
- ✅ Tag normalization
- ✅ Slug generation
- ⚠️ Integration tests (missing)
- ⚠️ E2E tests (missing)
- ⚠️ Server actions (not directly tested)

**Test Commands:**
- `npm test` - Run unit tests
- `npm run test:db` - Test database connection
- `npm run type-check` - TypeScript validation
- `npm run lint` - ESLint checks

---

## Performance Characteristics

**Current Scale:** Designed for <100 prompts, <1000 users

**Known Bottlenecks:**
1. No pagination on browse page (loads all prompts)
2. No caching (every request hits database)
3. Connection pool defaults (now configured in Session 9)
4. No query optimization (loads all fields)

**Scaling Path:** See ARCHITECTURE.md "Future Architecture Considerations"

---

## Security Posture

**Strengths:**
- ✅ TypeScript strict mode
- ✅ Bcrypt password hashing (12 salt rounds)
- ✅ Prisma ORM (SQL injection protection)
- ✅ Server-side validation
- ✅ URL scheme validation (XSS prevention)
- ✅ External links use rel="noopener noreferrer"
- ✅ No secrets in code (environment variables)

**Weaknesses:**
- ❌ No email verification
- ❌ No rate limiting
- ❌ Weak password requirements
- ❌ No explicit CSRF tokens (relies on Next.js defaults)
- ❌ No admin audit logging
- ❌ No structured error logging

**Overall:** Decent for internal MVP, needs hardening before public launch

---

## Related Documentation

- **Architecture:** See `ARCHITECTURE.md` for system design
- **Code Style:** See `CODE_STYLE.md` for coding standards
- **Decisions:** See `DECISIONS.md` for "why" behind choices
- **Status:** See `STATUS.md` for current work
- **Review:** See `artifacts/code-reviews/session-8-review.md` for full analysis

---

**Last Updated:** 2025-11-24 (Session 9)
**Next Review:** After Phase 2 implementation
