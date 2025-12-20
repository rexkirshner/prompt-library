/**
 * Prompts Listing Page
 *
 * Displays all approved prompts in a browseable list with search and filtering.
 * Server component for SEO optimization.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { getCategories, getPopularTags } from '@/lib/db/cached-queries'
import { auth } from '@/lib/auth'
import { buildSearchWhere, parseTagFilter } from '@/lib/prompts/search'
import { PromptFilters } from '@/components/PromptFilters'
import { Pagination } from '@/components/Pagination'
import { PromptsListClient } from '@/components/PromptsListClient'
import { bulkResolvePrompts } from '@/lib/compound-prompts/bulk-resolution'
import { logger as baseLogger } from '@/lib/logging'
import { JsonLd } from '@/components/JsonLd'
import { generateCollectionPageSchema, getBaseUrl } from '@/lib/seo/json-ld'
import { Breadcrumbs } from '@/components/Breadcrumbs'

const logger = baseLogger.child({ module: 'prompts' })

export const metadata: Metadata = {
  title: 'Browse Prompts',
  description: 'Discover and explore AI prompts shared by the community',
  alternates: {
    canonical: `${getBaseUrl()}/prompts`,
  },
}

// Force dynamic rendering - page requires database access
export const dynamic = 'force-dynamic'

interface PromptsPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    tags?: string
    page?: string
    sort?: string
  }>
}

const ITEMS_PER_PAGE = 20

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const params = await searchParams

  // Get current session (required for user preference lookup)
  const session = await auth()

  // Fetch user's preferences from database (quick query, needed for sort order and filters)
  let userSortPreference: string | undefined
  let userHideAiPreference = false
  if (session?.user?.id) {
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { sort_preference: true, hide_ai_generated: true },
    })
    userSortPreference = user?.sort_preference || undefined
    userHideAiPreference = user?.hide_ai_generated ?? false
  }

  // Build search filters from URL params and user preferences
  const filters = {
    query: params.q,
    category: params.category,
    tags: parseTagFilter(params.tags),
    hideAi: userHideAiPreference,
  }

  // Parse page number and sort parameter
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))
  const sortBy = params.sort || userSortPreference || 'newest'
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  // Build where clause for database queries
  const where = buildSearchWhere(filters)

  // Map sort parameter to orderBy clause
  const orderBy = (() => {
    switch (sortBy) {
      case 'alphabetical':
        return { title: 'asc' as const }
      case 'popular':
        return { copy_count: 'desc' as const }
      case 'newest':
      default:
        return { created_at: 'desc' as const }
    }
  })()

  // Fetch all page data in parallel for better performance
  // Categories and tags use cached queries for deduplication across components
  const [totalCount, prompts, categories, allTags] = await Promise.all([
    // Total count for pagination (search-specific, not cached)
    prisma.prompts.count({ where }),

    // Main prompts query with pagination (search-specific, not cached)
    // Optimized: select only fields needed for browse page display
    prisma.prompts.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        prompt_text: true, // Needed for non-compound prompts
        description: true,
        category: true,
        author_name: true,
        copy_count: true,
        is_compound: true, // Needed to determine resolution path
        ai_generated: true, // Needed for AI badge (logged-in users only)
        prompt_tags: {
          select: {
            tags: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy,
      skip,
      take: ITEMS_PER_PAGE,
    }),

    // Categories for filter dropdown (cached, deduped with other components)
    getCategories(),

    // Tags for filter chips (cached, deduped with other components)
    getPopularTags(20),
  ])

  // Calculate pagination values (uses totalCount from parallel fetch)
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  // Resolve compound prompts efficiently using bulk resolution
  // This eliminates N+1 queries: instead of 20 separate queries for compound prompts,
  // we make 1-3 queries total using breadth-first fetching
  const promptIds = prompts.map((p) => p.id)
  const bulkResolutionResult = await bulkResolvePrompts(promptIds)

  // Log query performance metrics
  logger.info('Browse page rendered', {
    promptCount: prompts.length,
    compoundCount: prompts.filter((p) => p.is_compound).length,
    queriesExecuted: bulkResolutionResult.queriesExecuted,
    successCount: bulkResolutionResult.successCount,
    errorCount: bulkResolutionResult.errorCount,
  })

  // Map prompts with resolved text
  const promptsWithResolvedText = prompts.map((prompt) => {
    const resolvedText = bulkResolutionResult.resolvedTexts.get(prompt.id)

    // Log errors for failed resolutions
    if (resolvedText === undefined && prompt.is_compound) {
      const errorMessage = bulkResolutionResult.errors.get(prompt.id)
      logger.error('Failed to resolve compound prompt', new Error(errorMessage), {
        promptId: prompt.id,
        slug: prompt.slug,
      })
    }

    return {
      ...prompt,
      resolved_text: resolvedText || prompt.prompt_text || '',
    }
  })

  // Generate structured data for SEO
  const baseUrl = getBaseUrl()
  const collectionSchema = generateCollectionPageSchema({
    name: 'AI Prompts Collection',
    description:
      'Browse and discover community-curated AI prompts for ChatGPT, Claude, and other AI assistants',
    url: `${baseUrl}/prompts`,
    numberOfItems: totalCount,
  })

  // Breadcrumb navigation
  const breadcrumbItems = [
    { name: 'Home', url: baseUrl, href: '/' },
    { name: 'Browse Prompts', url: `${baseUrl}/prompts` },
  ]

  return (
    <>
      {/* Structured data for SEO */}
      <JsonLd data={collectionSchema} />

      <div className="mx-auto max-w-7xl px-4 py-12">
        {/* Breadcrumb navigation */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Browse Prompts</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Discover AI prompts shared by the community
        </p>
      </div>

      {/* Search and Filters */}
      <PromptFilters
        categories={categories}
        allTags={allTags}
      />

      {/* Stats bar */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {totalCount} {totalCount === 1 ? 'prompt' : 'prompts'}{' '}
          {filters.query || filters.category || filters.tags.length > 0
            ? 'found'
            : 'available'}
        </p>
        <Link
          href="/submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Submit a Prompt
        </Link>
      </div>

      {/* Prompts list with view toggle */}
      {promptsWithResolvedText.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {filters.query || filters.category || filters.tags.length > 0
              ? 'No prompts found'
              : 'No prompts yet'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {filters.query || filters.category || filters.tags.length > 0
              ? 'Try adjusting your search or filters'
              : 'Be the first to submit a prompt to the library!'}
          </p>
          {!(filters.query || filters.category || filters.tags.length > 0) && (
            <Link
              href="/submit"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Submit a Prompt
            </Link>
          )}
        </div>
      ) : (
        <PromptsListClient
          prompts={promptsWithResolvedText}
          userId={session?.user?.id}
          sortPreference={userSortPreference}
          hideAiPreference={userHideAiPreference}
        />
      )}

      {/* Pagination */}
      {promptsWithResolvedText.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}
    </div>
    </>
  )
}
