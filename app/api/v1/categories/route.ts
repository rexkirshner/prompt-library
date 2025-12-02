/**
 * Categories API Endpoint
 *
 * GET /api/v1/categories - List all prompt categories
 *
 * Returns a simple array of category strings from approved prompts.
 * Uses cached query for performance.
 *
 * @module app/api/v1/categories
 */

import { NextRequest } from 'next/server'
import { getCategories } from '@/lib/db/cached-queries'
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

const logger = baseLogger.child({ module: 'api:categories' })

/**
 * Handle OPTIONS preflight request for CORS
 */
export async function OPTIONS() {
  return handleOptionsRequest()
}

/**
 * GET /api/v1/categories
 *
 * Returns all distinct categories from approved prompts.
 *
 * @example
 * GET /api/v1/categories
 *
 * Response:
 * {
 *   "success": true,
 *   "data": ["Coding", "Writing", "Research", ...]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Check rate limit
    if (!checkApiRateLimit(request)) {
      const retryAfter = getRetryAfter(request)
      logger.warn('Rate limit exceeded for categories endpoint', {
        retryAfter,
      })
      return apiRateLimited(retryAfter)
    }

    // Fetch categories using cached query
    const categories = await getCategories()

    // Record successful request
    recordApiRequest(request)

    logger.info('Categories fetched successfully', {
      count: categories.length,
    })

    return apiSuccess(categories)
  } catch (error) {
    logger.error('Error fetching categories', error as Error)
    return apiError(
      'INTERNAL_ERROR',
      'Failed to fetch categories',
      500
    )
  }
}
