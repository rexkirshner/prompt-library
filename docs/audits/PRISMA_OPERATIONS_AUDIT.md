# Prisma Database Operations Audit

**Date:** 2025-12-19
**Triggered By:** Vercel Postgres Suspended - 42k operations this month (exceeded free tier limit)
**Severity:** 🔴 **CRITICAL** - Production database suspended, site down

---

## Executive Summary

**Current State:** The application is making **excessive database queries** due to fundamental architectural issues, primarily **N+1 query problems** in compound prompt resolution. With 42k operations already this month, we're hitting Vercel's free tier limits and causing production outages.

**Root Cause:** Compound prompts trigger cascading database queries - for every compound prompt displayed, we make separate queries to fetch its components. On pages with 20 prompts, this means 20+ additional queries instead of 1-2 optimized queries.

**Impact:**
- ⚠️ **Production site suspended** due to database limits
- 💸 **Cannot scale** - each page view costs 10-50x more queries than necessary
- 🐌 **Slow performance** - sequential queries add significant latency
- 🔥 **Exponential growth** - nested compound prompts multiply the problem

**Solution Priority:** **IMMEDIATE** - Implement query optimization before resuming service

---

## Critical Issues (Immediate Action Required)

### 1. 🔴 CRITICAL: N+1 Query Problem on Browse Page

**Location:** `app/prompts/page.tsx:185-207`

**Issue:** For EVERY compound prompt on the page, we make a separate `findUnique` query to resolve it.

**Code:**
```typescript
// Lines 185-207
const promptsWithResolvedText = await Promise.all(
  prompts.map(async (prompt) => {
    let resolvedText: string
    if (prompt.is_compound) {
      try {
        // THIS TRIGGERS A SEPARATE QUERY FOR EACH COMPOUND PROMPT!
        resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)
      } catch (error) {
        // ...
      }
    } else {
      resolvedText = prompt.prompt_text || ''
    }
    return { ...prompt, resolved_text: resolvedText }
  })
)
```

**Query Pattern:**
```
Page with 20 prompts (10 compound, 10 regular):
1. findMany for 20 prompts                 [1 query]
2. For each of 10 compound prompts:
   - findUnique with includes              [10 queries]
   - For nested components (if any):
     - findUnique for each component       [10-50+ queries]

Total: 21-61+ queries per page load
```

**Frequency:** **EVERY browse page load** (most common page)

**Est. Impact:**
- ~50 browse page views per day
- ~10 prompts average are compound
- = **500+ unnecessary queries per day** from browse page alone

**Solution:**
```typescript
// OPTION 1: Include components in initial query
const prompts = await prisma.prompts.findMany({
  where,
  select: {
    // ... existing fields
    compound_components: {
      include: {
        component_prompt: true,
      },
      orderBy: { position: 'asc' },
    },
  },
  // ... rest
})

// Now resolve without additional queries
const promptsWithResolvedText = prompts.map((prompt) => {
  if (prompt.is_compound) {
    const resolvedText = resolvePromptFromComponents(prompt.compound_components)
    return { ...prompt, resolved_text: resolvedText }
  }
  return { ...prompt, resolved_text: prompt.prompt_text || '' }
})

// OPTION 2: Fetch all compound prompts + components in bulk
const compoundPromptIds = prompts
  .filter(p => p.is_compound)
  .map(p => p.id)

const componentsMap = await prisma.compound_prompt_components.findMany({
  where: { compound_prompt_id: { in: compoundPromptIds } },
  include: { component_prompt: true },
})
// Build map and resolve in memory
```

**Savings:** 10-50 queries per page → **1-2 queries per page** (90-95% reduction)

---

### 2. 🔴 CRITICAL: Duplicate Queries on Detail Page

**Location:** `app/prompts/[slug]/page.tsx`

**Issue:** The same prompt is queried **4 times** on a single page load:

1. **`generateMetadata()` line 81**: `findUnique` with includes for metadata
2. **`generateMetadata()` line 103**: `resolvePrompt()` if compound (another `findUnique`)
3. **Main component line 150**: `findUnique` with includes (DUPLICATE of #1)
4. **Main component line 198**: `resolvePrompt()` if compound (DUPLICATE of #2)

**Code:**
```typescript
// FIRST QUERY - generateMetadata() line 81-90
export async function generateMetadata({ params }: PromptPageProps) {
  const { slug } = await params
  const prompt = await prisma.prompts.findUnique({  // QUERY #1
    where: { slug },
    include: {
      prompt_tags: { include: { tags: true } },
    },
  })

  // SECOND QUERY - if compound, line 103
  if (prompt.is_compound) {
    const resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)  // QUERY #2
  }
}

// THIRD QUERY - Main component line 150-171
export default async function PromptPage({ params }: PromptPageProps) {
  const prompt = await prisma.prompts.findUnique({  // QUERY #3 (DUPLICATE!)
    where: { slug },
    include: {
      prompt_tags: { include: { tags: true } },
      compound_components: {
        include: { component_prompt: { select: {...} } },
      },
    },
  })

  // FOURTH QUERY - if compound, line 198
  if (prompt.is_compound) {
    displayText = await resolvePrompt(prompt.id, getPromptWithComponents)  // QUERY #4 (DUPLICATE!)
  }
}
```

**Est. Impact:**
- ~100 detail page views per day
- 4 queries each = **400 queries per day**
- Should be **100 queries** (75% reduction)

**Solution:**
```typescript
// Create a cached function for prompt fetching
import { cache } from 'react'

const getCachedPromptBySlug = cache(async (slug: string) => {
  return prisma.prompts.findUnique({
    where: { slug },
    include: {
      prompt_tags: { include: { tags: true } },
      compound_components: {
        include: { component_prompt: true },
        orderBy: { position: 'asc' },
      },
    },
  })
})

// Use in both generateMetadata AND main component
export async function generateMetadata({ params }) {
  const prompt = await getCachedPromptBySlug(params.slug)  // Cached!
  // ... resolve if needed (also cached via React.cache)
}

export default async function PromptPage({ params }) {
  const prompt = await getCachedPromptBySlug(params.slug)  // Same cache!
  // ... resolve if needed (also cached via React.cache)
}
```

**Savings:** 4 queries per page → **1-2 queries per page** (50-75% reduction)

---

### 3. 🔴 CRITICAL: N+1 Query Problem in API Endpoint

**Location:** `app/api/v1/prompts/route.ts:198-216`

**Issue:** Same N+1 problem as browse page, but worse because API allows up to 100 prompts per request.

**Code:**
```typescript
// Lines 198-216
const promptsWithResolvedText = await Promise.all(
  prompts.map(async (prompt) => {
    let resolvedText: string
    if (prompt.is_compound) {
      try {
        // SEPARATE QUERY FOR EACH COMPOUND PROMPT!
        resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)
      } catch (error) {
        // ...
      }
    } else {
      resolvedText = prompt.prompt_text || ''
    }
    return [prompt, resolvedText] as [typeof prompt, string]
  })
)
```

**Worst Case:**
```
API call: GET /api/v1/prompts?limit=100
- All 100 prompts are compound
- Each has 3 nested components

Queries:
1. findMany for 100 prompts                [1 query]
2. For each prompt:
   - findUnique                            [100 queries]
   - For each component:
     - findUnique                          [300 queries]

Total: 401 queries for ONE API call!
```

**Frequency:** Unknown (external API usage), but each call is expensive

**Solution:** Same as browse page - include components in initial query or bulk fetch

---

## High Priority Issues

### 4. 🟠 No Cross-Request Caching

**Location:** `lib/db/cached-queries.ts`

**Issue:** `React.cache()` only deduplicates within a single request. Categories, tags, and featured prompts are fetched fresh on EVERY page load.

**Current Implementation:**
```typescript
// lib/db/cached-queries.ts
export const getCategories = cache(async () => {
  const results = await prisma.prompts.findMany({
    where: { status: 'APPROVED', deleted_at: null },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  })
  return results.map((r) => r.category)
})
```

**Problem:** This query runs on **every page load** even though categories rarely change.

**Pages Using These:**
- Browse page (`getCategories`, `getPopularTags`)
- Submit page (`getCategories`, `getPopularTags`)
- Admin pages (`getCategories`, `getAvailablePromptsForCompound`)

**Est. Impact:**
- Categories query: ~200 calls per day
- Popular tags query: ~200 calls per day
- = **400 queries** that could be cached for hours

**Solution:**
```typescript
import { unstable_cache } from 'next/cache'

// Cache for 1 hour, revalidate in background
export const getCategories = unstable_cache(
  async () => {
    const results = await prisma.prompts.findMany({
      where: { status: 'APPROVED', deleted_at: null },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    })
    return results.map((r) => r.category)
  },
  ['categories'],  // Cache key
  {
    revalidate: 3600,  // 1 hour
    tags: ['categories'],  // For manual invalidation
  }
)

// Invalidate when prompts change
await revalidateTag('categories')
```

**Savings:** 400 queries per day → **24 queries per day** (95% reduction)

---

### 5. 🟠 getAvailablePromptsForCompound Fetches All Prompts

**Location:** `lib/db/cached-queries.ts:80-107`

**Issue:** Every time admin creates/edits a compound prompt, ALL approved prompts are fetched (no limit).

**Code:**
```typescript
export const getAvailablePromptsForCompound = cache(async () => {
  return prisma.prompts.findMany({
    where: { status: 'APPROVED', deleted_at: null },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      is_compound: true,
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
    // NO LIMIT!
  })
})
```

**Problem:**
- If you have 500 approved prompts, this fetches all 500
- Used in dropdown/selector UI (only shows ~20 at a time)
- Heavy query for minimal UX benefit

**Est. Impact:**
- Admin compound prompt page loads: ~20 per day
- Average 200 prompts fetched each time
- = **Wasted bandwidth and processing**

**Solution:**
```typescript
// OPTION 1: Pagination/search in UI (recommended)
export async function searchPromptsForCompound(searchTerm?: string, limit = 50) {
  return prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
      ...(searchTerm && {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      }),
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      is_compound: true,
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
    take: limit,
  })
}

// OPTION 2: Simple limit (quick fix)
export const getAvailablePromptsForCompound = cache(async () => {
  return prisma.prompts.findMany({
    // ... same where/select
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
    take: 500,  // Reasonable max
  })
})
```

**Savings:** Reduces payload size significantly, prevents unbounded growth

---

### 6. 🟠 Related Prompts on Every Detail Page

**Location:** `app/prompts/[slug]/page.tsx:431`

**Issue:** Every detail page loads related prompts, which does 2 additional queries.

**Code:**
```typescript
// Line 431
<RelatedPrompts promptId={prompt.id} limit={5} />
```

**Queries Triggered:**
```typescript
// lib/prompts/related.ts
export async function findRelatedPrompts(promptId, options) {
  // QUERY 1: Get source prompt with tags
  const sourcePrompt = await prisma.prompts.findUnique({
    where: { id: promptId },
    select: {
      category: true,
      prompt_tags: { select: { tag_id: true } },
    },
  })

  // QUERY 2: Get candidate prompts (fetches limit * 3)
  const candidates = await prisma.prompts.findMany({
    where: { AND: whereConditions },
    select: { /* ... */ },
    take: opts.limit * 3,  // Fetches 15 for limit of 5
  })
}
```

**Est. Impact:**
- ~100 detail page views per day
- 2 queries each = **200 queries per day**

**Optimization:**
```typescript
// OPTION 1: Include tags in main query (already have category)
export default async function PromptPage({ params }) {
  const prompt = await prisma.prompts.findUnique({
    where: { slug: params.slug },
    include: {
      prompt_tags: { include: { tags: true } },  // Already included!
      // ... other includes
    },
  })

  // Pass tags to avoid re-fetch
  <RelatedPrompts
    promptId={prompt.id}
    category={prompt.category}
    tagIds={prompt.prompt_tags.map(pt => pt.tags.id)}
    limit={5}
  />
}

// OPTION 2: Cache related prompts
import { unstable_cache } from 'next/cache'

const getCachedRelatedPrompts = unstable_cache(
  (promptId) => findRelatedPrompts(promptId, { limit: 5 }),
  (promptId) => ['related-prompts', promptId],
  { revalidate: 3600 }  // 1 hour
)
```

**Savings:** 200 queries per day → **100 queries per day** (50% reduction)

---

## Medium Priority Issues

### 7. 🟡 View Count Increment on Every Detail Page Load

**Location:** `app/prompts/[slug]/page.tsx:180-192`

**Issue:** Fire-and-forget update on EVERY page view, even for same user reloading.

**Code:**
```typescript
// Lines 180-192 - Runs on EVERY page load
prisma.prompts
  .update({
    where: { id: prompt.id },
    data: { view_count: { increment: 1 } },
  })
  .catch((err) => logger.warn(/*...*/))
```

**Problem:**
- Bot traffic counts as views
- Same user refreshing increments
- Adds 1 query per detail page load

**Est. Impact:**
- ~100 detail page views per day = **100 extra update queries**

**Solution:**
```typescript
// OPTION 1: Debounce/dedupe with cookies (recommended)
import { cookies } from 'next/headers'

export default async function PromptPage({ params }) {
  // ... fetch prompt

  // Check if user already viewed this prompt recently
  const cookieStore = await cookies()
  const viewedKey = `viewed_${prompt.id}`
  const hasViewed = cookieStore.has(viewedKey)

  if (!hasViewed) {
    // Increment view count
    prisma.prompts
      .update({
        where: { id: prompt.id },
        data: { view_count: { increment: 1 } },
      })
      .catch((err) => logger.warn(/*...*/))

    // Set cookie for 24 hours
    cookieStore.set(viewedKey, '1', {
      maxAge: 86400,  // 24 hours
      httpOnly: true,
    })
  }
}

// OPTION 2: Batch view count updates
// Collect view events in Redis/memory, bulk update every 5 minutes
```

**Savings:** 100 queries per day → **20-30 queries per day** (70-80% reduction)

---

### 8. 🟡 Missing Indexes

**Current Indexes:** (from `prisma/schema.prisma`)
```prisma
model prompts {
  @@index([slug])
  @@index([status, created_at])
  @@index([status, featured, approved_at])
  @@index([category])
  @@index([deleted_at])
  @@index([status, deleted_at])
  @@index([is_compound])
}
```

**Missing Indexes:**

#### 8.1 Title Search (Full-Text)
**Query:** `app/prompts/page.tsx` - search by title, description, prompt_text

**Current:** Sequential scan for `LIKE '%search%'`

**Recommendation:**
```prisma
model prompts {
  // Add full-text search indexes
  @@index([title(ops: raw("gin_trgm_ops"))], type: Gin)

  // Or use PostgreSQL full-text search
  @@index([title, description, prompt_text], type: Gin, name: "search_idx")
}
```

#### 8.2 Compound Prompt + Status
**Query:** Common filter: `is_compound = true AND status = 'APPROVED'`

**Recommendation:**
```prisma
model prompts {
  @@index([is_compound, status, deleted_at])  // Composite for common query
}
```

#### 8.3 AI Generated Filter
**Query:** `ai_generated = false AND status = 'APPROVED'` (hide AI filter)

**Recommendation:**
```prisma
model prompts {
  @@index([ai_generated, status, deleted_at])
}
```

#### 8.4 Sort by Copy Count
**Query:** `ORDER BY copy_count DESC` (popular sort)

**Recommendation:**
```prisma
model prompts {
  @@index([copy_count])
}
```

---

## Recommendations

### Immediate (Week 1)

1. **Fix N+1 on Browse Page** - Include compound components in initial query
   **Impact:** 90% reduction in browse page queries (500+ queries/day saved)

2. **Fix Duplicate Queries on Detail Page** - Use `cache()` for shared prompt fetch
   **Impact:** 50-75% reduction in detail page queries (200-300 queries/day saved)

3. **Fix N+1 in API Endpoint** - Bulk fetch compound components
   **Impact:** 95% reduction in API queries

**Total Savings:** ~**1,000-1,500 queries per day** (50-70% overall reduction)

### Short-Term (Week 2-3)

4. **Implement Cross-Request Caching** - Use `unstable_cache` for categories, tags, featured prompts
   **Impact:** 400 queries/day → 24 queries/day (95% reduction)

5. **Add Missing Database Indexes** - title search, copy_count, compound+status, ai_generated+status
   **Impact:** Faster query execution, better scalability

6. **Optimize Related Prompts** - Pass data from parent, use caching
   **Impact:** 50% reduction (100 queries/day saved)

**Total Savings:** ~**500+ queries per day** (additional 25% reduction)

### Long-Term (Month 1-2)

7. **Implement Query Result Caching** - Redis or similar for frequently accessed prompts
8. **Add Database Read Replicas** - Distribute read load (if needed at scale)
9. **Batch View Count Updates** - Collect in memory, update every 5 minutes
10. **Implement Compound Prompt Materialization** - Pre-resolve and cache compound prompts

---

## Monitoring & Measurement

### Before Optimization
- **Current:** 42,000 operations this month (19 days) = ~2,210 ops/day
- **Free Tier:** 60 hours compute/month, 256MB storage, operations limit

### Target After Optimization
- **Goal:** <500 operations/day = ~15,000 ops/month (66% reduction)
- **Stretch:** <300 operations/day = ~9,000 ops/month (80% reduction)

### Key Metrics to Track
1. **Prisma Operations per Day** - Track in Vercel dashboard
2. **Average Queries per Page Load** - Add logging
3. **P95 Response Time** - Should improve significantly
4. **Cache Hit Rate** - For `unstable_cache` usage

### Logging Implementation
```typescript
// Add to each optimized endpoint
logger.info('Page rendered', {
  page: 'prompts-browse',
  queriesExecuted: 3,  // Track this!
  compoundPrompts: 5,
  cacheHits: 2,
  queryTimeMs: 245,
})
```

---

## Testing Strategy

### Unit Tests
- Test compound prompt resolution with pre-fetched data
- Test caching functions
- Test related prompts with mocked data

### Integration Tests
- Measure queries per page load (before/after)
- Test cache invalidation
- Test with realistic data volumes (500+ prompts)

### Load Tests
- Simulate 100 concurrent users
- Monitor Prisma operation count
- Verify caching works under load

---

## Appendix: Query Patterns Analysis

### Most Expensive Queries

1. **Compound Prompt Resolution** (N+1)
   - Frequency: 10-20x per browse page, 1-2x per detail page, up to 100x per API call
   - Cost: 1-5 queries each
   - **Total: ~1,000 queries/day**

2. **Categories/Tags Fetching** (No cache)
   - Frequency: Every page load
   - Cost: 2 queries
   - **Total: ~400 queries/day**

3. **Related Prompts** (Every detail page)
   - Frequency: 100x per day
   - Cost: 2 queries each
   - **Total: 200 queries/day**

4. **View Count Updates** (Fire-and-forget)
   - Frequency: Every detail page view
   - Cost: 1 query each
   - **Total: 100 queries/day**

5. **Duplicate Fetches** (Detail page)
   - Frequency: 100x per day
   - Cost: 2 extra queries each
   - **Total: 200 queries/day**

**Grand Total Waste:** ~**1,900 queries/day** that can be eliminated or cached

---

## Conclusion

The application's database usage is **2-5x higher than necessary** due to architectural issues, not traffic volume. The immediate priority is fixing the N+1 query problems in compound prompt resolution, which alone accounts for **50-70% of total operations**.

**Recommended Action:**
1. Fix browse page N+1 (highest impact)
2. Fix detail page duplicates (quick win)
3. Fix API endpoint N+1 (prevent abuse)
4. Implement caching (long-term savings)

**Expected Outcome:** Reduce operations from 2,210/day to **500-700/day** (66-75% reduction), staying well within free tier limits and improving performance significantly.
