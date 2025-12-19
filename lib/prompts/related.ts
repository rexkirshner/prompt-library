/**
 * Related Prompts Utilities
 *
 * Functions for finding and suggesting related prompts based on
 * category similarity and tag overlap.
 *
 * @module lib/prompts/related
 */

import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

/**
 * Options for finding related prompts
 */
export interface RelatedPromptsOptions {
  /** Maximum number of related prompts to return */
  limit?: number
  /** Minimum number of matching tags to include a prompt */
  minTagMatches?: number
  /** Whether to include prompts from different categories */
  includeDifferentCategories?: boolean
}

/**
 * Default options for related prompts queries
 */
const DEFAULT_OPTIONS: Required<RelatedPromptsOptions> = {
  limit: 5,
  minTagMatches: 0,
  includeDifferentCategories: true,
}

/**
 * Related prompt result with relevance score
 */
export interface RelatedPrompt {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  author_name: string
  copy_count: number
  /** Number of matching tags (0 if match is by category only) */
  matchingTags: number
  /** Whether the category matches */
  sameCategory: boolean
  /** Relevance score (higher = more relevant) */
  relevanceScore: number
  prompt_tags: Array<{
    tags: {
      id: string
      name: string
      slug: string
    }
  }>
}

/**
 * Calculate relevance score for a related prompt
 *
 * Score is based on:
 * - Category match: +10 points
 * - Each matching tag: +5 points
 * - Copy count popularity boost: +0.01 per copy (max +10)
 *
 * @param matchingTags - Number of tags that match the source prompt
 * @param sameCategory - Whether the category matches
 * @param copyCount - Number of times the prompt has been copied
 * @returns Relevance score (higher is better)
 *
 * @example
 * ```typescript
 * const score = calculateRelevanceScore(3, true, 150)
 * // Returns: 10 + (3 * 5) + min(150 * 0.01, 10) = 26.5
 * ```
 */
export function calculateRelevanceScore(
  matchingTags: number,
  sameCategory: boolean,
  copyCount: number
): number {
  let score = 0

  // Category match bonus
  if (sameCategory) {
    score += 10
  }

  // Tag matching bonus
  score += matchingTags * 5

  // Popularity boost (diminishing returns)
  const popularityBoost = Math.min(copyCount * 0.01, 10)
  score += popularityBoost

  return score
}

/**
 * Find related prompts based on category and tag similarity
 *
 * Returns prompts that share the same category or have overlapping tags,
 * ordered by relevance score (category match + tag overlap + popularity).
 *
 * @param promptId - ID of the source prompt
 * @param options - Configuration options
 * @returns Array of related prompts with relevance scores
 *
 * @example
 * ```typescript
 * // Find up to 5 related prompts
 * const related = await findRelatedPrompts('prompt-id-123')
 *
 * // Find 3 prompts with at least 2 matching tags
 * const related = await findRelatedPrompts('prompt-id-123', {
 *   limit: 3,
 *   minTagMatches: 2,
 * })
 *
 * // Find prompts only from the same category
 * const related = await findRelatedPrompts('prompt-id-123', {
 *   includeDifferentCategories: false,
 * })
 * ```
 */
export async function findRelatedPrompts(
  promptId: string,
  options: RelatedPromptsOptions = {}
): Promise<RelatedPrompt[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 1. Get the source prompt with its category and tags
  const sourcePrompt = await prisma.prompts.findUnique({
    where: { id: promptId },
    select: {
      category: true,
      prompt_tags: {
        select: {
          tag_id: true,
        },
      },
    },
  })

  if (!sourcePrompt) {
    return []
  }

  const sourceTagIds = sourcePrompt.prompt_tags.map((pt) => pt.tag_id)

  // 2. Build where clause based on options
  const whereConditions: Prisma.promptsWhereInput[] = []

  // Always exclude the source prompt
  whereConditions.push({ NOT: { id: promptId } })

  // Only approved prompts
  whereConditions.push({ status: 'APPROVED' })

  // Not deleted
  whereConditions.push({ deleted_at: null })

  // 3. Build category/tag filter
  const categoryTagFilter: Prisma.promptsWhereInput[] = []

  // Include same category prompts
  if (opts.includeDifferentCategories || sourceTagIds.length === 0) {
    categoryTagFilter.push({ category: sourcePrompt.category })
  }

  // Include prompts with matching tags (if source has tags)
  if (sourceTagIds.length > 0) {
    categoryTagFilter.push({
      prompt_tags: {
        some: {
          tag_id: {
            in: sourceTagIds,
          },
        },
      },
    })
  }

  // If we have category or tag filters, combine them with OR
  if (categoryTagFilter.length > 0) {
    whereConditions.push({
      OR: categoryTagFilter,
    })
  }

  // 4. Fetch candidate prompts
  const candidates = await prisma.prompts.findMany({
    where: {
      AND: whereConditions,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      author_name: true,
      copy_count: true,
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
    // Fetch extra candidates for scoring and filtering
    take: opts.limit * 3,
  })

  // 5. Calculate relevance scores
  const scoredPrompts: RelatedPrompt[] = candidates.map((prompt) => {
    const promptTagIds = prompt.prompt_tags.map((pt) => pt.tags.id)
    const matchingTags = promptTagIds.filter((id) => sourceTagIds.includes(id))
      .length
    const sameCategory = prompt.category === sourcePrompt.category

    return {
      ...prompt,
      matchingTags,
      sameCategory,
      relevanceScore: calculateRelevanceScore(
        matchingTags,
        sameCategory,
        prompt.copy_count
      ),
    }
  })

  // 6. Filter by minimum tag matches if specified
  let filtered = scoredPrompts
  if (opts.minTagMatches > 0) {
    filtered = scoredPrompts.filter(
      (p) => p.matchingTags >= opts.minTagMatches
    )
  }

  // 7. Sort by relevance score (highest first) and limit
  const sorted = filtered.sort((a, b) => b.relevanceScore - a.relevanceScore)

  return sorted.slice(0, opts.limit)
}

/**
 * Get a simple list of related prompts for display
 *
 * Convenience function that returns only essential fields for UI display.
 *
 * @param promptId - ID of the source prompt
 * @param limit - Maximum number of prompts to return (default: 5)
 * @returns Array of related prompts with essential fields only
 *
 * @example
 * ```typescript
 * const related = await getRelatedPromptsForDisplay('prompt-id-123', 3)
 * // Returns: [{ id, slug, title, category, ... }, ...]
 * ```
 */
export async function getRelatedPromptsForDisplay(
  promptId: string,
  limit = 5
) {
  return findRelatedPrompts(promptId, { limit })
}
