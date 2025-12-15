# Input Atlas Roadmap

**Last Updated:** 2025-12-14 (Session 17 - Sprint 005)

This roadmap outlines outstanding issues, deferred work, and potential future enhancements for the Input Atlas project.

## Current Status

**Project State:** 🟢 Active Development (Sprint 005 Complete)
- Sprint 003 complete: 74 failing tests fixed, 55 ESLint errors resolved
- Sprint 004 complete: Hanging tests fixed, generateUniqueSlug extracted
- Sprint 005 complete: Rate limiting, input validation, accessibility, query optimization
- Next.js updated to 16.0.10 (security fix CVE-2025-66478)
- 402 tests passing (includes 11 new rate limiting tests)
- 0 ESLint errors (16 warnings)
- Production build verified
- Code review grade: A- (upgraded from B+)
- 12 of 20 code review issues resolved

## Outstanding Code Quality Issues

### From Session 15 Code Review

**M2: Fire-and-forget database operations without error boundary**
- **Location:** `app/prompts/[slug]/page.tsx:171-181` (view count increment)
- **Issue:** Using `.catch()` for fire-and-forget but errors silently logged, no monitoring
- **Impact:** Silent failures, no alerting for database issues
- **Suggested Fix:** Add structured logging with severity levels, consider error aggregation
- **Effort:** 1 hour

**M3: Inconsistent error handling in server actions**
- **Location:** Multiple server action files
- **Issue:** Some actions return `{ success: false, errors: { form: '...' } }`, others throw
- **Impact:** Inconsistent client-side error handling
- **Suggested Fix:** Standardize error response format across all server actions
- **Effort:** 2-3 hours

**M6: Session configuration may cause auth issues**
- **Location:** `lib/auth/config.ts:117-120`
- **Issue:** JWT session maxAge is 30 days, but no refresh token logic visible
- **Impact:** Users may experience unexpected logouts
- **Suggested Fix:** Document session behavior, consider adding session refresh logic
- **Effort:** Research + 2-3 hours implementation

**M7: API documentation page has hardcoded base URL**
- **Location:** `app/api-docs/page.tsx`
- **Issue:** API docs likely reference localhost or hardcoded production URL
- **Impact:** Confusing for developers in different environments
- **Suggested Fix:** Use environment variable or relative URLs
- **Effort:** 30 minutes

### Low Priority (6 Issues)

**L1: Console statements in test output**
- **Location:** Test runs show `console.log` from dotenv
- **Issue:** Noisy test output
- **Suggested Fix:** Suppress console in test environment
- **Effort:** 15 minutes

**L2: Missing JSDoc on several functions**
- **Location:** Various utility functions
- **Issue:** Some functions lack documentation
- **Suggested Fix:** Add JSDoc to public APIs and complex functions
- **Effort:** 1-2 hours

**L3: Inconsistent date handling**
- **Location:** `app/submit/actions.ts:156`
- **Issue:** Some timestamps use `new Date()`, others rely on Prisma defaults
- **Suggested Fix:** Consistently use Prisma `@updatedAt` directive
- **Effort:** 1 hour

**L4: TagInput component could use debounce**
- **Location:** `components/TagInput.tsx:118-124`
- **Issue:** `onBlur` immediately tries to add tag, no debounce
- **Suggested Fix:** Add small debounce to prevent double-adds
- **Effort:** 30 minutes

**L5: No bundle size monitoring**
- **Location:** N/A
- **Issue:** No bundle analyzer configured
- **Suggested Fix:** Add `@next/bundle-analyzer` to track bundle size
- **Effort:** 30 minutes

**L6: Docker Compose missing app service**
- **Location:** `docker-compose.yml`
- **Issue:** Only database service defined, no app service
- **Suggested Fix:** Add app service with proper environment configuration
- **Effort:** 1 hour

### Deferred

**H4: useCopyPreferences hook extraction**
- **Status:** Deferred (too risky)
- **Reason:** Complex interdependencies between CopyButton, CopyPreview, GlobalSettings
- **When to revisit:** If copy logic needs significant changes

### Resolved in Sprint 005 ✅

- **H5:** Auth rate limiting → Created `lib/auth/rate-limit.ts` with IP-based limiting
- **M4:** Input sanitization → Added `isValidTag` check after `normalizeTag`
- **M5:** Missing ARIA labels → Added `aria-pressed`, `aria-label`, `role="group"`
- **M8:** Query optimization → Changed browse page from `include` to `select`

### Resolved in Sprint 004 ✅

- **H1:** Hanging audit/import-export tests → Fixed with --forceExit flag
- **L3:** generateUniqueSlug duplication → Extracted to `lib/prompts/validation.ts`

### Resolved in Sprint 003 ✅

- **C1:** 74 failing tests → All tests passing (dotenv override fix)
- **H1:** 55 ESLint errors → 0 errors (queueMicrotask pattern, type narrowing)
- **H2:** getPromptWithComponents duplication → Extracted to `lib/compound-prompts/fetcher.ts`

## Deferred Features

Features identified but not yet implemented:

### Phase 4 Candidates (User Decision Required)

**1. Advanced Search & Filtering**
- Full-text search across prompts
- Filter by category, tags, author
- Search within compound prompts
- Effort: 5-8 hours

**2. Prompt Versioning**
- Track prompt changes over time
- Diff viewer for prompt history
- Rollback capability
- Effort: 8-12 hours

**3. Collaboration Features**
- Multi-user prompt editing
- Comments and discussions
- Approval workflows
- Effort: 15-20 hours

**4. Analytics Dashboard**
- Prompt usage statistics
- Popular prompts tracking
- User engagement metrics
- Effort: 6-10 hours

**5. API Endpoints**
- RESTful API for prompt access
- API key authentication
- Rate limiting
- Effort: 8-12 hours

## Known Limitations

### By Design

**1. Manual Moderation**
- All submissions require manual approval
- Intentional for quality control
- Not a bug, but could be enhanced with automated pre-screening

**2. Email/Password Auth Only**
- No OAuth providers (Google, GitHub, etc.)
- Decision made to avoid OAuth approval process
- Could add later if needed

**3. Single Admin Bootstrap**
- First admin created via CLI script
- Subsequent admins invited by existing admins
- Intentional for security

### Technical Constraints

**1. Compound Prompt Depth Limit**
- Max depth tracked but not enforced
- Very deep nesting could cause performance issues
- Consider adding configurable limit (e.g., max_depth = 10)

**2. Import File Size**
- No explicit file size limit on imports
- Very large imports could timeout
- Consider adding file size validation (e.g., 10MB limit)

**3. Concurrent Editing**
- No optimistic locking or conflict resolution
- Last write wins
- Fine for small community, could be issue at scale

## Infrastructure Improvements

### Performance Optimization

**1. Database Indexing** ✅ DONE (Session 15)
- Added indexes on frequently queried columns
- Significant query performance improvement
- No further work needed

**2. Caching Layer** (Deferred)
- Redis cache for frequently accessed prompts
- Cache invalidation on updates
- Effort: 6-8 hours
- Value: High for production at scale

**3. Image Optimization** (Not Applicable)
- Project doesn't currently use images
- Consider if adding prompt thumbnails

### Monitoring & Observability

**1. Error Tracking** (Partial - Logging exists)
- Structured logging in place
- Consider adding Sentry or similar
- Effort: 2-3 hours
- Value: High for production debugging

**2. Performance Monitoring** (Not Implemented)
- Frontend performance tracking
- API response time monitoring
- Effort: 3-4 hours
- Value: Medium (helpful but not critical)

**3. Audit Log Viewer** (Future Enhancement)
- UI for viewing audit logs
- Filter and search capabilities
- Effort: 6-8 hours
- Value: High for admin management

## Security Enhancements

### Completed ✅

- Session 15: Fixed mass assignment vulnerability (C2)
- Session 15: Added password complexity requirements (C3)
- Session 15: Fixed session token exposure (C4)
- Session 15: Added XSS protection (C5)
- Session 15: Fixed SQL injection vulnerability (C6)
- Session 17 / Sprint 005: Added auth rate limiting (H5)
  - Sign-in: 5 attempts per 15 minutes per IP
  - Sign-up: 3 attempts per hour per IP
  - In-memory storage with automatic cleanup

### Future Considerations

**1. Two-Factor Authentication**
- TOTP-based 2FA for admins
- Effort: 8-10 hours
- Value: High for security-conscious deployments

**2. Security Headers**
- CSP, HSTS, X-Frame-Options
- Effort: 2-3 hours
- Value: High (easy security wins)

**3. Automated Security Scanning**
- Dependabot for dependency updates
- Regular security audits
- Effort: 1-2 hours (setup)
- Value: High (proactive security)

## Documentation Improvements

### Completed ✅

- Session 16: Comprehensive SESSIONS.md with mental models
- Session 16: Updated STATUS.md for maintenance mode
- Session 16: Enhanced README.md
- Session 16: Created MAINTENANCE.md return guide
- Session 16: Created ROADMAP.md (this document)
- Sessions 1-16: All architectural decisions documented in DECISIONS.md

### Future Additions

**1. API Documentation** (If API built)
- OpenAPI/Swagger spec
- Endpoint examples
- Authentication guide

**2. User Guide** (Production)
- End-user documentation
- How to create prompts
- How to use compound prompts

**3. Deployment Guide** (Production)
- Production setup checklist
- Environment configuration
- Monitoring setup

## Next Steps (When Returning)

**Recommended Priority Order:**

1. **Environment Setup** (Required)
   - Follow [MAINTENANCE.md](MAINTENANCE.md) Quick Start
   - Verify all tests pass
   - Confirm dev environment works

2. **Review Outstanding Issues** (Optional)
   - Read M1, L1, L2 details in code review
   - Decide if any are worth addressing
   - All are non-blocking

3. **User Decision Point**
   - Launch preparation vs feature development
   - Phase 4 feature selection
   - Production readiness review

4. **Potential Quick Wins** (If desired)
   - Fix L2 (circular dep error messages) - 1-2 hours
   - Add security headers - 2-3 hours
   - Set up Dependabot - 1 hour

## Archived / Completed Phases

**Phase 0: MVP** ✅ Complete
- Basic prompt CRUD
- Database schema
- Authentication

**Phase 1: User System** ✅ Complete
- User registration and login
- Admin roles
- Profile management

**Phase 2: Compound Prompts** ✅ Complete
- Compound prompts v1.0 (Session 5)
- Compound prompts v2.0 (Sessions 8-9)
- Full recursive resolution

**Phase 3: Polish & Launch Prep** ✅ Complete
- SEO optimization (Session 13)
- Performance optimization (Session 13)
- Import/export system (Session 11-12)
- Code quality improvements (Sessions 14-16)

---

**Need to prioritize?** See [context/STATUS.md](context/STATUS.md) for current focus and immediate next steps.

**Need background?** See [context/SESSIONS.md](context/SESSIONS.md) for full development history with technical context.

**Need architecture details?** See [context/ARCHITECTURE.md](context/ARCHITECTURE.md) for system design and patterns.
