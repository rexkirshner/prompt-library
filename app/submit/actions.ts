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
  type PromptSubmissionData,
} from '@/lib/prompts/validation'

export interface SubmitPromptResult {
  success: boolean
  errors?: Record<string, string>
  message?: string
  promptId?: string
}

/**
 * Create or find tags by name
 * Returns array of tag IDs
 */
async function ensureTags(tagNames: string[]): Promise<string[]> {
  const tagIds: string[] = []

  for (const tagName of tagNames) {
    const normalizedName = normalizeTag(tagName)
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
          created_at: new Date(),
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
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  // Keep trying until we find a unique slug
  while (true) {
    const existing = await prisma.prompts.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
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
    const now = new Date()
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
        created_at: now,
        updated_at: now,
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
    console.error('Prompt submission error:', error)
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
