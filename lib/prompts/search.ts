/**
 * Prompt Search and Filtering Module
 *
 * Provides utilities for searching and filtering prompts.
 * Uses PostgreSQL for full-text search and filter operations.
 */

import { Prisma } from '@prisma/client'

export interface SearchFilters {
  query?: string
  category?: string
  tags?: string[]
  hideAi?: boolean
}

/**
 * Build Prisma where clause for prompt search and filtering
 *
 * @param filters - Search and filter parameters
 * @returns Prisma where clause
 */
export function buildSearchWhere(
  filters: SearchFilters
): Prisma.promptsWhereInput {
  const where: Prisma.promptsWhereInput = {
    status: 'APPROVED',
    deleted_at: null,
  }

  // Add search query (searches title, prompt_text, and description)
  if (filters.query && filters.query.trim()) {
    const searchTerm = filters.query.trim()
    where.OR = [
      {
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        prompt_text: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
    ]
  }

  // Add category filter
  if (filters.category && filters.category.trim()) {
    where.category = filters.category.trim()
  }

  // Add tag filters (must have ALL specified tags - AND logic)
  if (filters.tags && filters.tags.length > 0) {
    where.prompt_tags = {
      some: {
        tags: {
          slug: {
            in: filters.tags,
          },
        },
      },
    }
  }

  // Hide AI-generated prompts if requested
  if (filters.hideAi) {
    where.ai_generated = false
  }

  return where
}

/**
 * Validate search query
 *
 * @param query - Search query string
 * @returns Validation result
 */
export function validateSearchQuery(query: string): {
  valid: boolean
  error?: string
} {
  if (query.length > 200) {
    return {
      valid: false,
      error: 'Search query must be 200 characters or less',
    }
  }

  return { valid: true }
}

/**
 * Parse tag filter from URL param
 *
 * @param param - URL parameter value (can be string or string[])
 * @returns Array of tag slugs
 */
export function parseTagFilter(param: string | string[] | undefined): string[] {
  if (!param) return []
  if (Array.isArray(param)) return param
  return param.split(',').filter(Boolean)
}
