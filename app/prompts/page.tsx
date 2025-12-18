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
import { resolvePrompt } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'prompts' })

export const metadata: Metadata = {
  title: 'Browse Prompts - Input Atlas',
  description: 'Discover and explore AI prompts shared by the community',
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
    hideAi?: string
  }>
}

const ITEMS_PER_PAGE = 20

/**
 * Helper to fetch prompt with components for resolution
 */
async function getPromptWithComponents(
  id: string
): Promise<CompoundPromptWithComponents | null> {
  const prompt = await prisma.prompts.findUnique({
    where: { id },
    include: {
      compound_components: {
        include: {
          component_prompt: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!prompt) return null

  return {
    id: prompt.id,
    prompt_text: prompt.prompt_text,
    is_compound: prompt.is_compound,
    max_depth: prompt.max_depth,
    compound_components: prompt.compound_components.map((comp) => ({
      ...comp,
      component_prompt: comp.component_prompt
        ? {
            id: comp.component_prompt.id,
            prompt_text: comp.component_prompt.prompt_text,
            is_compound: comp.component_prompt.is_compound,
            max_depth: comp.component_prompt.max_depth,
          }
        : null,
    })),
  }
}

export default async function PromptsPage({ searchParams }: PromptsPageProps) {
  const params = await searchParams

  // Get current session (required for user preference lookup)
  const session = await auth()

  // Fetch user's sort preference from database (quick query, needed for sort order)
  let userSortPreference: string | undefined
  if (session?.user?.id) {
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { sort_preference: true },
    })
    userSortPreference = user?.sort_preference || undefined
  }

  // Build search filters from URL params
  const hideAi = params.hideAi === 'true'
  const filters = {
    query: params.q,
    category: params.category,
    tags: parseTagFilter(params.tags),
    hideAi,
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

  // Resolve compound prompts to get their display text
  // Note: This still runs sequentially per prompt as each may need nested lookups
  const promptsWithResolvedText = await Promise.all(
    prompts.map(async (prompt) => {
      let resolvedText: string
      if (prompt.is_compound) {
        try {
          resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)
        } catch (error) {
          logger.error('Failed to resolve compound prompt', error as Error, {
            promptId: prompt.id,
            slug: prompt.slug,
          })
          resolvedText = ''
        }
      } else {
        resolvedText = prompt.prompt_text || ''
      }

      return {
        ...prompt,
        resolved_text: resolvedText,
      }
    })
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
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
          {promptsWithResolvedText.length} {promptsWithResolvedText.length === 1 ? 'prompt' : 'prompts'}{' '}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {filters.query || filters.category || filters.tags.length > 0
              ? 'No prompts found'
              : 'No prompts yet'}
          </h3>
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
          hideAiGenerated={hideAi}
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
  )
}
