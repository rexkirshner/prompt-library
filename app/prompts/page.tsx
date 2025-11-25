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

export const metadata: Metadata = {
  title: 'Browse Prompts - AI Prompts Library',
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
  }>
}

const ITEMS_PER_PAGE = 20

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

  // Build where clause
  const where = buildSearchWhere(filters)

  // Fetch total count for pagination
  const totalCount = await prisma.prompts.count({ where })

  // Calculate pagination
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const skip = (currentPage - 1) * ITEMS_PER_PAGE

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
    orderBy: {
      created_at: 'desc',
    },
    skip,
    take: ITEMS_PER_PAGE,
  })

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
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'}{' '}
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
      {prompts.length === 0 ? (
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
        <PromptsListClient prompts={prompts} userId={session?.user?.id} />
      )}

      {/* Pagination */}
      {prompts.length > 0 && (
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
