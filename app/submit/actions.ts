/**
 * Prompt Submission Server Actions
 *
 * Server-side actions for creating and managing prompt submissions.
 * Handles validation, slug generation, and database operations.
 */

'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'
import {
  validatePromptSubmission,
  generateSlug,
  normalizeTag,
  isValidTag,
  type PromptSubmissionData,
} from '@/lib/prompts/validation'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'submit/actions' })

export interface SubmitPromptResult {
  success: boolean
  errors?: Record<string, string>
  message?: string
  promptId?: string
}

/**
 * Create or find tags by name
 * Returns array of tag IDs
 *
 * @security Defense-in-depth: validates normalized tag pattern before DB operations
 */
async function ensureTags(tagNames: string[]): Promise<string[]> {
  const tagIds: string[] = []

  for (const tagName of tagNames) {
    const normalizedName = normalizeTag(tagName)

    // Defense-in-depth: validate normalized tag matches expected pattern
    // This catches any edge cases where normalizeTag might produce unexpected output
    if (!isValidTag(normalizedName)) {
      logger.warn('Tag failed validation after normalization', {
        original: tagName,
        normalized: normalizedName,
      })
      continue // Skip invalid tags rather than throwing
    }

    const slug = generateSlug(normalizedName)

    // Try to find existing tag
    let tag = await prisma.tags.findUnique({
      where: { slug },
    })

    // Create tag if it doesn't exist
    if (!tag) {
      tag = await prisma.tags.create({
        data: {
          id: crypto.randomUUID(),
          name: normalizedName,
          slug,
          usage_count: 0,
          // created_at uses database default (@default(now()))
        },
      })
    }

    tagIds.push(tag.id)
  }

  return tagIds
}

/**
 * Generate unique slug for prompt
 * Appends number suffix if slug already exists
 *
 * @throws Error if unable to generate unique slug after MAX_SLUG_ATTEMPTS
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const MAX_SLUG_ATTEMPTS = 100
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  // Try to find unique slug with max attempts limit
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const existing = await prisma.prompts.findUnique({
      where: { slug },
    })

    if (!existing) {
      // Log warning if took many attempts
      if (attempt > 10) {
        logger.warn(
          `Slug generation took ${attempt} attempts`,
          { title, attempts: attempt }
        )
      }
      return slug
    }

    // After 50 attempts, add randomness to avoid infinite collision
    if (attempt >= 50) {
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      slug = `${baseSlug}-${randomSuffix}`
    } else {
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  // If we exhausted all attempts, throw error
  throw new Error(
    `Unable to generate unique slug after ${MAX_SLUG_ATTEMPTS} attempts for title: "${title}"`
  )
}

/**
 * Submit a new prompt
 *
 * @param formData - Prompt submission data
 * @returns Result with success status and any errors
 */
export async function submitPrompt(
  formData: PromptSubmissionData,
): Promise<SubmitPromptResult> {
  // Validate form data
  const validation = validatePromptSubmission(formData)
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    }
  }

  try {
    // Get current user (optional - can submit anonymously)
    const user = await getCurrentUser()

    // Generate unique slug
    const slug = await generateUniqueSlug(formData.title)

    // Ensure all tags exist and get their IDs
    const tagIds = await ensureTags(formData.tags)

    // Create prompt
    const prompt = await prisma.prompts.create({
      data: {
        id: crypto.randomUUID(),
        slug,
        title: formData.title.trim(),
        prompt_text: formData.promptText.trim(),
        description: formData.description?.trim() || null,
        example_output: formData.exampleOutput?.trim() || null,
        category: formData.category,
        author_name: formData.authorName.trim(),
        author_url: formData.authorUrl?.trim() || null,
        submitted_by_user_id: user?.id || null,
        status: 'PENDING',
        featured: false,
        view_count: 0,
        copy_count: 0,
        // created_at uses @default(now()), updated_at uses @updatedAt
      },
    })

    // Create tag associations
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

    return {
      success: true,
      message: 'Prompt submitted successfully! It will be reviewed by our team.',
      promptId: prompt.id,
    }
  } catch (error) {
    logger.error('Prompt submission error', error as Error)
    return {
      success: false,
      errors: {
        form: 'An unexpected error occurred. Please try again.',
      },
    }
  }
}

/**
 * Server action for form submission
 * Redirects to success page on completion
 */
export async function handleSubmitPrompt(
  prevState: unknown,
  formData: FormData,
) {
  // Extract tags from form data (could be multiple fields)
  const tags: string[] = []
  let tagIndex = 0
  while (formData.has(`tag-${tagIndex}`)) {
    const tag = formData.get(`tag-${tagIndex}`) as string
    if (tag && tag.trim().length > 0) {
      tags.push(tag.trim())
    }
    tagIndex++
  }

  const data: PromptSubmissionData = {
    title: formData.get('title') as string,
    promptText: formData.get('promptText') as string,
    description: (formData.get('description') as string) || undefined,
    exampleOutput: (formData.get('exampleOutput') as string) || undefined,
    category: formData.get('category') as string,
    tags,
    authorName: formData.get('authorName') as string,
    authorUrl: (formData.get('authorUrl') as string) || undefined,
  }

  const result = await submitPrompt(data)

  if (result.success) {
    // Redirect to success page
    redirect('/submit/success')
  }

  return result
}
