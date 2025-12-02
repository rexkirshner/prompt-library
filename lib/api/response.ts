/**
 * API Response Helpers
 *
 * Standardized response formats and CORS headers for public API endpoints.
 * All responses follow a consistent structure with success/error indicators.
 *
 * @module lib/api/response
 */

import { NextResponse } from 'next/server'

/**
 * CORS headers for public API access
 * Allows cross-origin requests from any domain
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

/**
 * Metadata for paginated responses
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Success response with data and optional pagination metadata
 *
 * @param data - Response payload
 * @param meta - Optional pagination metadata
 * @returns NextResponse with CORS headers
 *
 * @example
 * return apiSuccess({ prompts: [...] }, { page: 1, limit: 20, total: 100, totalPages: 5 })
 * // => { success: true, data: {...}, meta: {...} }
 */
export function apiSuccess<T>(
  data: T,
  meta?: PaginationMeta
): NextResponse {
  const body = meta ? { success: true, data, meta } : { success: true, data }

  return NextResponse.json(body, {
    status: 200,
    headers: CORS_HEADERS,
  })
}

/**
 * Error response with code and message
 *
 * @param code - Error code (e.g., 'NOT_FOUND', 'INVALID_REQUEST')
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with CORS headers
 *
 * @example
 * return apiError('INVALID_LIMIT', 'Limit must be between 1 and 100', 400)
 * // => { success: false, error: { code: 'INVALID_LIMIT', message: '...' } }
 */
export function apiError(
  code: string,
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
      },
    },
    {
      status,
      headers: CORS_HEADERS,
    }
  )
}

/**
 * Not found error (404)
 *
 * @param message - Optional custom message (default: 'Resource not found')
 * @returns NextResponse with 404 status
 *
 * @example
 * return apiNotFound('Prompt not found')
 * // => 404 { success: false, error: { code: 'NOT_FOUND', message: '...' } }
 */
export function apiNotFound(message: string = 'Resource not found'): NextResponse {
  return apiError('NOT_FOUND', message, 404)
}

/**
 * Rate limit exceeded error (429)
 *
 * Includes Retry-After header with seconds until limit resets.
 *
 * @param retryAfter - Seconds until rate limit resets
 * @returns NextResponse with 429 status and Retry-After header
 *
 * @example
 * return apiRateLimited(3600) // 1 hour
 * // => 429 with Retry-After: 3600
 */
export function apiRateLimited(retryAfter: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      },
    },
    {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        'Retry-After': retryAfter.toString(),
      },
    }
  )
}

/**
 * Handle OPTIONS preflight request
 *
 * Required for CORS preflight requests from browsers.
 *
 * @returns Empty response with CORS headers
 *
 * @example
 * export async function OPTIONS() {
 *   return handleOptionsRequest()
 * }
 */
export function handleOptionsRequest(): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  })
}
