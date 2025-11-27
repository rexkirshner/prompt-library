# Input Atlas Roadmap

**Last Updated:** 2025-11-27 (Session 16 - Maintenance Mode)

This roadmap outlines outstanding issues, deferred work, and potential future enhancements for the Input Atlas project.

## Current Status

**Project State:** 🟡 Maintenance Mode
- All critical and high-priority issues resolved
- Type system clean and well-documented
- 75 tests passing
- Production build verified
- Comprehensive documentation complete

## Outstanding Code Quality Issues

From [Session 14 Code Review](artifacts/code-reviews/session-14-review.md):

### Medium Priority (1 Issue)

**M1: Type safety for compound component relationships**
- **Location:** lib/compound-prompts/services/component-service.ts
- **Issue:** Component relationship validation returns boolean, loses type information
- **Impact:** Harder to debug validation failures, no IDE autocomplete for errors
- **Suggested Fix:** Return typed result objects with error details
- **Effort:** 2-3 hours (types, tests, update callers)
- **Risk:** Low (isolated to component service)

### Low Priority (2 Issues)

**L1: Test coverage for import/export service**
- **Location:** lib/import-export/services/__tests__/
- **Issue:** Missing tests for edge cases (concurrent imports, very large files, malformed JSON recovery)
- **Impact:** Could miss edge case bugs
- **Suggested Fix:** Add comprehensive edge case tests
- **Effort:** 3-4 hours (test scenarios, fixtures, assertions)
- **Risk:** Very Low (test additions only)

**L2: Edge case handling for circular dependencies**
- **Location:** lib/compound-prompts/services/resolution-service.ts
- **Issue:** Circular dependency detection works but error messages could be clearer
- **Impact:** User confusion when cycles detected
- **Suggested Fix:** Include full dependency path in error message
- **Effort:** 1-2 hours (error formatting, tests)
- **Risk:** Very Low (error handling only)

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

- Session 15: Fixed auth rate limiting (C1)
- Session 15: Fixed mass assignment vulnerability (C2)
- Session 15: Added password complexity requirements (C3)
- Session 15: Fixed session token exposure (C4)
- Session 15: Added XSS protection (C5)
- Session 15: Fixed SQL injection vulnerability (C6)

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
