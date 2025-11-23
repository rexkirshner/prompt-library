# PRD-v1 Codex Suggestions

## Key Themes

- Clarify north-star metrics, moderation SLAs, and community health KPIs to keep roadmap accountable.
- Strengthen the domain model (tags, versions, slugs, audit logs) so the library remains maintainable as catalog volume grows.
- Treat search, caching, and content delivery as first-class architectural concerns to keep discovery fast.
- Invest early in trust & safety, observability, and ops automation to run a lean yet resilient platform.

## Detailed Recommendations

### Goals, Metrics & Success Criteria

1. Add explicit north-star metric definitions (e.g., "weekly active prompt borrowers" or "approved prompts/week") plus quality guardrails (approval rate, average moderation turnaround) to `## Goals` and `## Success Metrics` (PRD.md:6-211).
2. Define Service Level Objectives: e.g., "P95 search latency under 300ms" and "moderation of 90% of submissions within 48h"—use these to prioritize infra vs. UX tasks.
3. Capture leading indicators for content freshness (ratio of prompts updated in last 90 days) and community engagement (suggested edits per approved prompt).

### Architecture & Infrastructure

1. Document environment strategy (dev/preview/prod) plus Infrastructure-as-Code (Vercel + managed Postgres via Terraform) to avoid snowflake deployments (PRD.md:18-24).
2. Clarify hosting model: edge runtime vs. Node serverless functions; specify caching layers (ISR for static pages, Redis/Upstash for hot lists) and invalidation rules when prompts move from pending→approved.
3. Plan for search scalability: start with Postgres + trigram/GiST indexes; define criteria for when to migrate to Algolia/Typesense/Meilisearch, including reindex jobs and analyzer choices.
4. Add background job runner (Next.js Route Handlers + queue such as Inngest/Queue/Trigger.dev) for moderation notifications, periodic tag cleanup, and backup exports.
5. Include image/asset handling if prompts may embed reference files—decide whether to disallow, sanitize, or upload to object storage.

### Data & Domain Modeling

1. Normalize tags into their own table with slug, description, and `is_featured` flag; support synonyms/aliases for better search (PRD.md:133-175).
2. Introduce `PromptVersion` table (id, prompt_id, payload JSONB, source_type=new|edit|admin, created_by, created_at) to capture revision history and power rollback/version diffing (ties to Phase 3 "Prompt versioning" in PRD.md:231-236—promote to earlier phase).
3. Add globally unique `slug` on prompts for stable URLs/SEO; include `visibility` enum (public/unlisted) to support curated drops or drafts.
4. Replace `tags: String[]` with join table `PromptTag`; this enables tag-level analytics and prevents orphaned tags.
5. Track `rejection_reason`, `moderation_notes`, and `auto_flagged` boolean on prompts to build moderation insights and training data for future automation.
6. Decide on soft delete vs. hard delete (recommend soft delete with `deleted_at`, `deleted_by`), plus periodic cleanup job for GDPR compliance.

### UX & Content Strategy

1. Expand Prompt Entry spec (PRD.md:52-75) to cover minimum quality checklist, word-count guidance, and optional fields such as "Ideal persona" or "Example output" to reduce low-signal submissions.
2. Define submission onboarding: inline guidelines, preview panel, and validation (e.g., enforce minimum 150 characters, limit to 5 tags, allow markdown but sanitize + render preview). Recommend adopting sanitized Markdown with a constrained renderer and automatic conversion to plain text for copy.
3. Clarify search UX: highlight matching tokens, show empty-state suggestions, provide pinned categories ("Staff Picks", "Trending").
4. Add community trust signals: show approval date, editor notes, "Last quality check" badge, and optionally allow admin-curated collections.
5. Document accessibility requirements beyond general principles (WCAG 2.1 AA, keyboard traps, focus outlines). Include plan for localization readiness even if not immediate.

### Moderation & Trust/Safety

1. Specify moderation states beyond pending/approved/rejected—e.g., `needs_clarification`, `auto-flagged`, `archived`. Define SLA + ownership for each (PRD.md:77-117).
2. Outline human vs. automated moderation split: add profanity/PII scanners, blocked keywords, and optional captcha for anonymous submissions; describe appeal/feedback loop for rejected prompts.
3. Include audit trail table logging admin actions (approve, edit, delete, role changes) with immutable entries to support investigations.
4. Describe abuse handling (DMCA requests, copyright claims) and support workflows (contact email, takedown SLAs).

### Notifications & Communication

1. Clarify which events trigger notifications (submission received, approved, rejected, edit accepted). Recommend transactional email service (Resend, Postmark) with feature flag to disable per environment.
2. Provide digest options (weekly summary to admins) rather than only real-time notifications.
3. Add in-app notifications/toasts for user submissions and a "My Submissions" activity feed with statuses.

### Observability, Ops & Reliability

1. Add logging/monitoring stack: Vercel + Logflare, Sentry, or OpenTelemetry; define alert thresholds (error rate, failed jobs, slow queries).
2. Define backup/restore process for Postgres (daily snapshots, point-in-time recovery) and test plan.
3. Outline feature flag strategy (LaunchDarkly, Vercel flags, custom table) for rolling out search improvements or markdown.
4. Document runbook basics: health checks, incident response channel, escalation tree, and dependency inventory (OAuth providers, DB, queue, email).

### Security & Privacy Enhancements

1. Clarify data retention for author emails (PRD.md:52-63) and ensure encryption at rest/in transit plus secrets management (Vercel env vars + secret rotation cadence).
2. Add requirement for privacy policy + terms, consent for displaying contributor names, and ability to anonymize past submissions on request.
3. Implement per-IP + per-account rate limiting with sliding window (e.g., 5 submissions/hour for anonymous, 20 for authenticated) plus CAPTCHA fallback. This answers open question on rate limiting (PRD.md:238-242).
4. Add requirement for dependency scanning (GitHub Dependabot), security headers (CSP, COOP/COEP, rate-limited API keys), and periodic penetration tests.

### Roadmap & Phasing

1. Revisit phase ordering (PRD.md:213-237): move "Prompt versioning/history" to Phase 2 since it underpins moderation quality; push "Share functionality" earlier to aid growth.
2. Add Exit criteria per phase ("Phase 1 complete when: 100 approved prompts, <1s search, admin queue manageable by 1 person").
3. Include "Phase 0" for design system + content seeding to ensure launch-ready catalog and consistent UI components.

### Updated Answers to Open Questions (PRD.md:238-242)

1. **Markdown support**: Yes, support CommonMark subset with server-side sanitization (rehype-sanitize) and preview before submission. Store both raw markdown and rendered HTML for caching.
2. **Rate limiting**: Implement dual-layer limits (per-IP + per-account) plus spam heuristics; expose config in admin settings for tuning. Add daily cap for anonymous submissions and CAPTCHA after threshold.
3. **Submission stats display**: Yes, show aggregate counters on homepage and admin dashboard to reinforce community momentum. Cache results and provide opt-out if growth slows.
4. **View counts/popularity**: Track page views + copy events via lightweight analytics (PostHog or Vercel Web Analytics). Use to power "Trending" sort and inform curation; respect privacy by aggregating data.

### Additional Open Questions to Resolve

1. What is the content license for submitted prompts (CC BY, CC0, proprietary)? Need explicit contributor agreement before publishing.
2. Will admins curate "featured" sections manually or via algorithm? Determine tooling requirements.
3. Do we need enterprise/teams roadmap (private prompt collections) and how would that influence current data model?
4. Should we allow attachments or reference links? Define validation rules to prevent malicious content.
5. What is deletion policy for user accounts—do we retain prompts, anonymize, or delete entirely?

## Next Steps

1. Align on data model changes (tags, versioning, audit logs) and update ERD before schema implementation.
2. Expand PRD sections cited above with clarified metrics, operational detail, and trust & safety requirements.
3. Validate roadmap reprioritization with stakeholders, then translate into engineering tickets / milestone plan.
