/**
 * Bulk Import Service
 *
 * Core business logic for processing bulk prompt imports.
 * Handles creation of prompts, tags, and slug generation.
 *
 * @module lib/admin/bulk-import/service
 */

import { prisma } from '@/lib/db/client'
import {
  generateUniqueSlug,
  normalizeTag,
  isValidTag,
  generateSlug,
} from '@/lib/prompts/validation'
import { logger as baseLogger } from '@/lib/logging'
import type {
  BulkImportPayload,
  BulkImportPromptInput,
  BulkImportResult,
  BulkImportPromptResult,
} from './types'

const logger = baseLogger.child({ module: 'admin:bulk-import:service' })

/** Default author name for AI-generated imports */
const DEFAULT_AUTHOR_NAME = 'Input Atlas AI'

/**
 * Process a bulk import of prompts
 *
 * Creates prompts with APPROVED status (admin-level import).
 * Handles slug generation, tag creation, and duplicate detection.
 *
 * @param payload - Validated bulk import payload
 * @param adminUserId - ID of the admin performing the import
 * @returns Result object with counts and individual prompt results
 *
 * @example
 * ```typescript
 * const result = await processBulkImport(validatedPayload, adminUserId)
 * console.log(`Created ${result.created} of ${result.total} prompts`)
 * ```
 */
export async function processBulkImport(
  payload: BulkImportPayload,
  adminUserId: string
): Promise<BulkImportResult> {
  const results: BulkImportPromptResult[] = []
  let created = 0
  let skipped = 0
  let failed = 0

  logger.info('Starting bulk import', {
    totalPrompts: payload.prompts.length,
    adminUserId,
  })

  for (const promptInput of payload.prompts) {
    const result = await processPromptImport(promptInput, adminUserId)
    results.push(result)

    if (result.success) {
      if (result.skipped) {
        skipped++
      } else {
        created++
      }
    } else {
      failed++
    }
  }

  const success = failed === 0
  const message = buildResultMessage(created, skipped, failed, payload.prompts.length)

  logger.info('Bulk import completed', {
    total: payload.prompts.length,
    created,
    skipped,
    failed,
    success,
    adminUserId,
  })

  return {
    total: payload.prompts.length,
    created,
    skipped,
    failed,
    results,
    success,
    message,
  }
}

/**
 * Process a single prompt import
 *
 * @internal
 */
async function processPromptImport(
  input: BulkImportPromptInput,
  adminUserId: string
): Promise<BulkImportPromptResult> {
  const title = input.title.trim()

  try {
    // Generate or use provided slug
    let slug: string
    if (input.slug) {
      slug = input.slug
      // Check if slug already exists
      const existing = await prisma.prompts.findUnique({
        where: { slug },
        select: { id: true },
      })
      if (existing) {
        logger.info('Skipping duplicate slug', { slug, title })
        return {
          title,
          slug,
          success: true,
          skipped: true,
          error: `Prompt with slug "${slug}" already exists`,
        }
      }
    } else {
      // Generate unique slug from title
      slug = await generateUniqueSlug(title, async (candidateSlug) => {
        const existing = await prisma.prompts.findUnique({
          where: { slug: candidateSlug },
          select: { id: true },
        })
        return existing !== null
      })
    }

    // Process tags
    const tagIds = await ensureTags(input.tags || [])

    // Apply defaults
    const authorName = input.author_name?.trim() || DEFAULT_AUTHOR_NAME
    const authorUrl = input.author_url?.trim() || null
    const description = input.description?.trim() || null
    const aiGenerated = input.ai_generated ?? true
    const featured = input.featured ?? false

    // Create the prompt with APPROVED status
    const prompt = await prisma.prompts.create({
      data: {
        id: crypto.randomUUID(),
        slug,
        title,
        prompt_text: input.prompt_text.trim(),
        description,
        category: input.category.trim(),
        author_name: authorName,
        author_url: authorUrl,
        ai_generated: aiGenerated,
        featured,
        status: 'APPROVED',
        submitted_by_user_id: adminUserId,
        view_count: 0,
        copy_count: 0,
        is_compound: false,
      },
    })

    // Create tag associations
    if (tagIds.length > 0) {
      await prisma.prompt_tags.createMany({
        data: tagIds.map((tagId) => ({
          prompt_id: prompt.id,
          tag_id: tagId,
        })),
      })

      // Update tag usage counts
      await prisma.tags.updateMany({
        where: { id: { in: tagIds } },
        data: { usage_count: { increment: 1 } },
      })
    }

    logger.debug('Prompt imported successfully', {
      id: prompt.id,
      slug,
      title,
      tagCount: tagIds.length,
    })

    return {
      title,
      slug,
      success: true,
      id: prompt.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error('Failed to import prompt', error as Error, { title })

    return {
      title,
      slug: input.slug || generateSlug(title),
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Ensure tags exist in database, creating them if needed
 *
 * @param tagNames - Array of tag names to process
 * @returns Array of tag IDs
 *
 * @internal
 */
async function ensureTags(tagNames: string[]): Promise<string[]> {
  const tagIds: string[] = []

  for (const tagName of tagNames) {
    const normalizedName = normalizeTag(tagName)

    // Skip invalid tags
    if (!isValidTag(normalizedName)) {
      logger.warn('Skipping invalid tag', {
        original: tagName,
        normalized: normalizedName,
      })
      continue
    }

    const slug = generateSlug(normalizedName)

    // Find or create tag
    let tag = await prisma.tags.findUnique({
      where: { slug },
    })

    if (!tag) {
      tag = await prisma.tags.create({
        data: {
          id: crypto.randomUUID(),
          name: normalizedName,
          slug,
          usage_count: 0,
        },
      })
      logger.debug('Created new tag', { slug, name: normalizedName })
    }

    tagIds.push(tag.id)
  }

  return tagIds
}

/**
 * Build human-readable result message
 *
 * @internal
 */
function buildResultMessage(
  created: number,
  skipped: number,
  failed: number,
  total: number
): string {
  const parts: string[] = []

  if (created > 0) {
    parts.push(`${created} prompt${created !== 1 ? 's' : ''} created`)
  }
  if (skipped > 0) {
    parts.push(`${skipped} skipped (duplicates)`)
  }
  if (failed > 0) {
    parts.push(`${failed} failed`)
  }

  if (parts.length === 0) {
    return 'No prompts were processed'
  }

  return `Processed ${total} prompt${total !== 1 ? 's' : ''}: ${parts.join(', ')}`
}
