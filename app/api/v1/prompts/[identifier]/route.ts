/**
 * Single Prompt API Endpoint
 *
 * GET /api/v1/prompts/:identifier - Get prompt by slug or UUID
 *
 * Accepts either a slug (URL-friendly string) or UUID identifier.
 * Returns full prompt data with resolved text for compound prompts.
 *
 * @module app/api/v1/prompts/[identifier]
 */

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/client'
import { auth } from '@/lib/auth'
import { resolvePrompt } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'
import { serializePrompt } from '@/lib/api/serializers'
import {
  apiSuccess,
  apiError,
  apiNotFound,
  apiRateLimited,
  handleOptionsRequest,
} from '@/lib/api/response'
import {
  checkApiRateLimit,
  recordApiRequest,
  getRetryAfter,
} from '@/lib/api/rate-limit'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'api:prompts:single' })

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteContext {
  params: Promise<{
    identifier: string
  }>
}

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
 * GET /api/v1/prompts/:identifier
 *
 * Returns a single prompt by slug or UUID.
 *
 * Identifier can be:
 * - A slug (e.g., "email-response-generator")
 * - A UUID (e.g., "550e8400-e29b-41d4-a716-446655440000")
 *
 * Only returns APPROVED prompts that are not soft-deleted.
 * For compound prompts, includes resolved_text with all components expanded.
 *
 * @example
 * GET /api/v1/prompts/email-response-generator
 * GET /api/v1/prompts/550e8400-e29b-41d4-a716-446655440000
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "...",
 *     "slug": "email-response-generator",
 *     "title": "Email Response Generator",
 *     "resolved_text": "...",
 *     ...
 *   }
 * }
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Check if user is authenticated (for conditional field visibility)
    const session = await auth()
    const isAuthenticated = !!session?.user

    // Check rate limit
    if (!checkApiRateLimit(request)) {
      const retryAfter = getRetryAfter(request)
      logger.warn('Rate limit exceeded for single prompt endpoint', {
        retryAfter,
      })
      return apiRateLimited(retryAfter)
    }

    // Extract identifier from params
    const { identifier } = await context.params

    // Determine if identifier is UUID or slug
    const isUuid = UUID_REGEX.test(identifier)

    // Query by ID or slug
    const prompt = await prisma.prompts.findUnique({
      where: isUuid ? { id: identifier } : { slug: identifier },
      include: {
        prompt_tags: {
          include: {
            tags: true,
          },
        },
      },
    })

    // Check if prompt exists and is approved
    if (!prompt || prompt.status !== 'APPROVED' || prompt.deleted_at) {
      logger.info('Prompt not found or not approved', {
        identifier,
        isUuid,
        found: !!prompt,
        status: prompt?.status,
        deleted: !!prompt?.deleted_at,
      })
      return apiNotFound('Prompt not found')
    }

    // Resolve compound prompts
    let resolvedText: string
    if (prompt.is_compound) {
      try {
        resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)
      } catch (error) {
        logger.error('Failed to resolve compound prompt', error as Error, {
          promptId: prompt.id,
          slug: prompt.slug,
        })
        // Return empty string on resolution failure
        resolvedText = ''
      }
    } else {
      resolvedText = prompt.prompt_text || ''
    }

    // Serialize to public format (author/AI info only for authenticated users)
    const publicPrompt = serializePrompt(prompt, resolvedText, {
      isAuthenticated,
    })

    // Record successful request
    recordApiRequest(request)

    logger.info('Prompt fetched successfully', {
      identifier,
      isUuid,
      slug: prompt.slug,
      isCompound: prompt.is_compound,
    })

    return apiSuccess(publicPrompt)
  } catch (error) {
    logger.error('Error fetching prompt', error as Error)
    return apiError(
      'INTERNAL_ERROR',
      'Failed to fetch prompt',
      500
    )
  }
}
