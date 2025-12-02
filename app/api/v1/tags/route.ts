/**
 * Tags API Endpoint
 *
 * GET /api/v1/tags - List popular tags
 *
 * Returns tags sorted by usage count with optional limit parameter.
 * Uses cached query for performance.
 *
 * @module app/api/v1/tags
 */

import { NextRequest } from 'next/server'
import { getPopularTags } from '@/lib/db/cached-queries'
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

const logger = baseLogger.child({ module: 'api:tags' })

// Default and maximum limits for tag results
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

/**
 * Handle OPTIONS preflight request for CORS
 */
export async function OPTIONS() {
  return handleOptionsRequest()
}

/**
 * GET /api/v1/tags
 *
 * Returns popular tags sorted by usage count.
 *
 * Query parameters:
 * - limit: Number of tags to return (default: 50, max: 100)
 *
 * @example
 * GET /api/v1/tags?limit=10
 *
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     { "slug": "ai", "name": "AI" },
 *     { "slug": "coding", "name": "Coding" },
 *     ...
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    if (!checkApiRateLimit(request)) {
      const retryAfter = getRetryAfter(request)
      logger.warn('Rate limit exceeded for tags endpoint', {
        retryAfter,
      })
      return apiRateLimited(retryAfter)
    }

    // Parse and validate limit parameter
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    let limit = DEFAULT_LIMIT

    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)

      // Validate limit is a number
      if (isNaN(parsedLimit)) {
        return apiError(
          'INVALID_LIMIT',
          'Limit must be a valid number',
          400
        )
      }

      // Validate limit is within bounds
      if (parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
        return apiError(
          'INVALID_LIMIT',
          `Limit must be between 1 and ${MAX_LIMIT}`,
          400
        )
      }

      limit = parsedLimit
    }

    // Fetch tags using cached query
    const tags = await getPopularTags(limit)

    // Record successful request
    recordApiRequest(request)

    logger.info('Tags fetched successfully', {
      count: tags.length,
      limit,
    })

    return apiSuccess(tags)
  } catch (error) {
    logger.error('Error fetching tags', error as Error)
    return apiError(
      'INTERNAL_ERROR',
      'Failed to fetch tags',
      500
    )
  }
}
