/**
 * Prompts Listing Page
 *
 * Displays all approved prompts in a browseable list with search and filtering.
 * Server component for SEO optimization.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'
import { auth } from '@/lib/auth'
import { buildSearchWhere, parseTagFilter } from '@/lib/prompts/search'
import { PromptFilters } from '@/components/PromptFilters'
import { Pagination } from '@/components/Pagination'
import { PromptsListClient } from '@/components/PromptsListClient'
import { SortDropdown } from '@/components/SortDropdown'
import { resolvePrompt } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'

export const metadata: Metadata = {
  title: 'Browse Prompts - AI Prompt Library',
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

  // Get current session
  const session = await auth()

  // Build search filters
  const filters = {
    query: params.q,
    category: params.category,
    tags: parseTagFilter(params.tags),
  }

  // Parse page number
  const currentPage = Math.max(1, parseInt(params.page || '1', 10))

  // Parse sort parameter
  const sortBy = params.sort || 'newest'

  // Build where clause
  const where = buildSearchWhere(filters)

  // Fetch total count for pagination
  const totalCount = await prisma.prompts.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

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

  // Fetch filtered prompts with pagination
  const prompts = await prisma.prompts.findMany({
    where,
    include: {
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
    orderBy,
    skip,
    take: ITEMS_PER_PAGE,
  })

  // Resolve compound prompts to get their text
  const promptsWithResolvedText = await Promise.all(
    prompts.map(async (prompt) => {
      let resolvedText: string
      if (prompt.is_compound) {
        try {
          resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)
        } catch (error) {
          console.error('Failed to resolve compound prompt:', error)
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

  // Fetch all unique categories for filter dropdown
  const categories = await prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
    },
    select: {
      category: true,
    },
    distinct: ['category'],
    orderBy: {
      category: 'asc',
    },
  })

  // Fetch all tags for filter chips (ordered by usage)
  const allTags = await prisma.tags.findMany({
    orderBy: {
      usage_count: 'desc',
    },
    take: 20, // Only show top 20 tags
  })

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
        categories={categories.map((c) => c.category)}
        allTags={allTags.map((t) => ({ slug: t.slug, name: t.name }))}
      />

      {/* Stats bar */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {promptsWithResolvedText.length} {promptsWithResolvedText.length === 1 ? 'prompt' : 'prompts'}{' '}
            {filters.query || filters.category || filters.tags.length > 0
              ? 'found'
              : 'available'}
          </p>
          <SortDropdown />
        </div>
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
        <PromptsListClient prompts={promptsWithResolvedText} userId={session?.user?.id} />
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
