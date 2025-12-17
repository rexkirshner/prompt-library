/**
 * Prompts List API Endpoint
 *
 * GET /api/v1/prompts - List prompts with search, filters, and pagination
 *
 * Supports full-text search, category filtering, tag filtering, sorting,
 * and pagination. Returns only approved, non-deleted prompts.
 *
 * @module app/api/v1/prompts
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { auth } from '@/lib/auth'
import { buildSearchWhere, parseTagFilter } from '@/lib/prompts/search'
import { resolvePrompt } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'
import { serializePromptList } from '@/lib/api/serializers'
import {
  apiSuccess,
  apiError,
  apiRateLimited,
  handleOptionsRequest,
} from '@/lib/api/response'
import {
  checkApiRateLimit,
  recordApiRequest,
  getRetryAfter,
} from '@/lib/api/rate-limit'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'api:prompts:list' })

// Pagination constants
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100
const DEFAULT_PAGE = 1

/**
 * Helper to fetch prompt with components for compound resolution
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

/**
 * Handle OPTIONS preflight request for CORS
 */
export async function OPTIONS() {
  return handleOptionsRequest()
}

/**
 * GET /api/v1/prompts
 *
 * List prompts with optional search, filters, and pagination.
 *
 * Query parameters:
 * - q: Search query (searches title, description, prompt_text)
 * - category: Filter by category (exact match)
 * - tags: Comma-separated tag slugs (requires all tags)
 * - sort: Sort order - "newest" (default) or "alphabetical"
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * @example
 * GET /api/v1/prompts?q=email&category=Writing&sort=alphabetical&page=1&limit=10
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [{ ...prompt }, ...],
 *   "meta": {
 *     "page": 1,
 *     "limit": 10,
 *     "total": 45,
 *     "totalPages": 5
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated (for conditional field visibility)
    const session = await auth()
    const isAuthenticated = !!session?.user

    // Check rate limit
    if (!checkApiRateLimit(request)) {
      const retryAfter = getRetryAfter(request)
      logger.warn('Rate limit exceeded for prompts list endpoint', {
        retryAfter,
      })
      return apiRateLimited(retryAfter)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || undefined
    const category = searchParams.get('category') || undefined
    const tagsParam = searchParams.get('tags') || undefined
    const sortParam = searchParams.get('sort') || 'newest'
    const pageParam = searchParams.get('page') || String(DEFAULT_PAGE)
    const limitParam = searchParams.get('limit') || String(DEFAULT_LIMIT)

    // Validate and parse page
    const page = parseInt(pageParam, 10)
    if (isNaN(page) || page < 1) {
      return apiError('INVALID_PAGE', 'Page must be a positive number', 400)
    }

    // Validate and parse limit
    const limit = parseInt(limitParam, 10)
    if (isNaN(limit)) {
      return apiError('INVALID_LIMIT', 'Limit must be a valid number', 400)
    }
    if (limit < 1 || limit > MAX_LIMIT) {
      return apiError(
        'INVALID_LIMIT',
        `Limit must be between 1 and ${MAX_LIMIT}`,
        400
      )
    }

    // Validate sort parameter
    if (sortParam !== 'newest' && sortParam !== 'alphabetical') {
      return apiError(
        'INVALID_SORT',
        'Sort must be "newest" or "alphabetical"',
        400
      )
    }

    // Build search filters
    const tags = parseTagFilter(tagsParam)
    const filters = { query, category, tags }
    const where = buildSearchWhere(filters)

    // Map sort to orderBy
    const orderBy =
      sortParam === 'alphabetical'
        ? { title: 'asc' as const }
        : { created_at: 'desc' as const }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch prompts and total count in parallel
    const [prompts, totalCount] = await Promise.all([
      prisma.prompts.findMany({
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
        take: limit,
      }),
      prisma.prompts.count({ where }),
    ])

    // Resolve compound prompts
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
        return [prompt, resolvedText] as [typeof prompt, string]
      })
    )

    // Serialize to public format (author/AI info only for authenticated users)
    const publicPrompts = serializePromptList(promptsWithResolvedText, {
      isAuthenticated,
    })

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit)

    // Record successful request
    recordApiRequest(request)

    logger.info('Prompts list fetched successfully', {
      count: publicPrompts.length,
      total: totalCount,
      page,
      limit,
      filters: {
        hasQuery: !!query,
        category,
        tagCount: tags.length,
        sort: sortParam,
      },
    })

    return apiSuccess(publicPrompts, {
      page,
      limit,
      total: totalCount,
      totalPages,
    })
  } catch (error) {
    logger.error('Error fetching prompts list', error as Error)
    return apiError('INTERNAL_ERROR', 'Failed to fetch prompts', 500)
  }
}
