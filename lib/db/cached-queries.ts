/**
 * Cached Database Queries
 *
 * Uses React.cache() to deduplicate database queries within a single request.
 * This prevents duplicate queries when the same data is needed in multiple
 * components during server-side rendering.
 *
 * Usage:
 *   import { getCategories, getPopularTags } from '@/lib/db/cached-queries'
 *   const categories = await getCategories()
 *
 * Note: React.cache() deduplication only works within a single request/render.
 * For cross-request caching, use Next.js unstable_cache or external cache.
 */

import { cache } from 'react'
import { prisma } from './client'

/**
 * Get distinct categories from approved prompts
 * Cached per-request to deduplicate calls from filters, forms, etc.
 */
export const getCategories = cache(async (): Promise<string[]> => {
  const results = await prisma.prompts.findMany({
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

  return results.map((r) => r.category)
})

/**
 * Get popular tags for filter UI
 * Returns top N tags by usage count
 */
export const getPopularTags = cache(
  async (limit: number = 20): Promise<{ id: string; slug: string; name: string }[]> => {
    const tags = await prisma.tags.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
      },
      orderBy: {
        usage_count: 'desc',
      },
      take: limit,
    })

    return tags
  }
)

/**
 * Get total count of approved prompts
 * Used for "Browse X Prompts" button and similar UI elements
 */
export const getApprovedPromptCount = cache(async (): Promise<number> => {
  return prisma.prompts.count({
    where: {
      status: 'APPROVED',
      deleted_at: null,
    },
  })
})

/**
 * Get available prompts for compound prompt selection
 * Returns lightweight prompt data for dropdowns and selectors
 */
export const getAvailablePromptsForCompound = cache(
  async (): Promise<
    {
      id: string
      slug: string
      title: string
      description: string | null
      category: string
      is_compound: boolean
    }[]
  > => {
    return prisma.prompts.findMany({
      where: {
        status: 'APPROVED',
        deleted_at: null,
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
    })
  }
)

/**
 * Get featured prompts for home page
 * Returns most recent featured prompts with their tags
 */
export const getFeaturedPrompts = cache(async (limit: number = 3) => {
  return prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
      featured: true,
    },
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
    take: limit,
  })
})

/**
 * Get recent prompts for home page
 * Returns most recently approved prompts with their tags
 */
export const getRecentPrompts = cache(async (limit: number = 6) => {
  return prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
    },
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
    take: limit,
  })
})
