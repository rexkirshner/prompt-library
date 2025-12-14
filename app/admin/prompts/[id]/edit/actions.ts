/**
 * Admin Edit Prompt Actions
 *
 * Server actions for updating existing prompts.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'
import { getAdminUser } from '@/lib/auth/admin'
import { generateSlug } from '@/lib/prompts/validation'
import { isValidUrl } from '@/lib/utils/url'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'admin/prompts/edit/actions' })

export interface EditPromptResult {
  success: boolean
  errors?: {
    title?: string
    promptText?: string
    category?: string
    tags?: string
    description?: string
    exampleOutput?: string
    authorName?: string
    authorUrl?: string
    form?: string
  }
  message?: string
}

export interface EditPromptData {
  id: string
  slug: string
  status: string
  title: string
  promptText: string
  category: string
  description: string
  exampleOutput: string
  authorName: string
  authorUrl: string
  featured: boolean
  tags: string[]
}

/**
 * Generate unique slug for prompt, excluding a specific prompt ID
 *
 * Creates a URL-safe slug from the prompt title and ensures uniqueness
 * by checking for collisions in the database. When editing an existing
 * prompt, excludes that prompt's ID from collision detection to allow
 * keeping the same slug when the title hasn't changed significantly.
 *
 * Uses incremental suffixes (-1, -2, -3...) for the first 50 attempts,
 * then switches to random suffixes for better collision resistance.
 *
 * @param title - The prompt title to convert into a slug
 * @param excludeId - The prompt ID to exclude from collision detection (allows editing)
 * @returns A unique slug that's safe to use for this prompt
 * @throws Error if unable to generate unique slug after 100 attempts
 *
 * @example
 * ```typescript
 * // Creating slug for new prompt title during edit
 * const slug = await generateUniqueSlug(
 *   'How to Write Better Prompts',
 *   'existing-prompt-id-123'
 * )
 * // Returns: 'how-to-write-better-prompts'
 * // Or if collision: 'how-to-write-better-prompts-1'
 * ```
 *
 * @example
 * ```typescript
 * // Editing prompt with same title keeps existing slug
 * const existingPrompt = await getPrompt('id-123')
 * const newSlug = await generateUniqueSlug(
 *   existingPrompt.title, // Same title
 *   'id-123'
 * )
 * // Returns existing slug since no collision (same prompt ID)
 * ```
 */
async function generateUniqueSlug(title: string, excludeId: string): Promise<string> {
  const MAX_SLUG_ATTEMPTS = 100
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const existing = await prisma.prompts.findUnique({
      where: { slug },
    })

    // Allow if no existing prompt or if it's the same prompt being edited
    if (!existing || existing.id === excludeId) {
      return slug
    }

    // After 50 attempts, add randomness
    if (attempt >= 50) {
      const randomSuffix = Math.random().toString(36).substring(2, 8)
      slug = `${baseSlug}-${randomSuffix}`
    } else {
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  throw new Error(
    `Unable to generate unique slug after ${MAX_SLUG_ATTEMPTS} attempts for title: "${title}"`,
  )
}

/**
 * Update an existing prompt with validation and tag management (admin only)
 *
 * Updates all fields of an existing prompt including title, content, category,
 * tags, and author information. Handles slug regeneration when title changes,
 * manages tag associations, and uses database transactions for consistency.
 *
 * After successful update, revalidates relevant pages and redirects based on
 * prompt status (pending prompts go to queue, approved go to prompt page).
 *
 * @param data - Complete prompt data including all fields to update
 * @returns Result object indicating success/failure with validation errors
 *
 * @security
 * - Requires admin authentication
 * - Validates all input fields (length, format, required fields)
 * - Uses transactions to ensure data consistency
 * - Sanitizes URLs to prevent XSS attacks
 *
 * @validation
 * - Title: 10-100 characters
 * - Prompt text: 150-5000 characters
 * - Category: Required
 * - Tags: 1-5 tags required
 * - Author name: Required, max 100 characters
 * - Author URL: Must be valid URL if provided
 *
 * @sideEffects
 * - Updates prompt in database
 * - Creates/updates tag records
 * - Revalidates cached pages
 * - Redirects to appropriate page (throws redirect)
 *
 * @example
 * ```typescript
 * // Update prompt from admin edit form
 * const result = await updatePrompt({
 *   id: 'prompt-123',
 *   slug: 'current-slug',
 *   status: 'APPROVED',
 *   title: 'Updated Title for Better Prompts',
 *   promptText: 'Act as a helpful assistant and...',
 *   category: 'Writing',
 *   description: 'Helps with writing tasks',
 *   exampleOutput: 'Here is an example...',
 *   authorName: 'John Doe',
 *   authorUrl: 'https://johndoe.com',
 *   tags: ['writing', 'assistant', 'productivity']
 * })
 *
 * // Success: Redirects to /prompts/updated-title-for-better-prompts
 * // Or if pending: Redirects to /admin/queue
 * ```
 *
 * @example
 * ```typescript
 * // Handle validation errors
 * const result = await updatePrompt({
 *   id: 'prompt-123',
 *   title: 'Short', // Too short!
 *   // ... other fields
 * })
 *
 * if (!result.success) {
 *   console.log(result.errors?.title)
 *   // "Title must be between 10 and 100 characters"
 * }
 * ```
 */
export async function updatePrompt(
  data: EditPromptData,
): Promise<EditPromptResult> {
  // Declare variables outside try-catch for use in redirect
  let existingPrompt: Prisma.promptsGetPayload<{ include: { prompt_tags: true } }> | null = null
  let newSlug: string = data.slug

  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, errors: { form: 'Unauthorized: Admin access required' } }
    }

    // Validate required fields
    const errors: EditPromptResult['errors'] = {}

    if (!data.title || data.title.length < 10 || data.title.length > 100) {
      errors.title = 'Title must be between 10 and 100 characters'
    }

    if (!data.promptText || data.promptText.length < 150 || data.promptText.length > 5000) {
      errors.promptText = 'Prompt text must be between 150 and 5000 characters'
    }

    if (!data.category) {
      errors.category = 'Category is required'
    }

    if (data.tags.length < 1 || data.tags.length > 5) {
      errors.tags = 'Must have 1-5 tags'
    }

    if (!data.authorName || data.authorName.length > 100) {
      errors.authorName = 'Author name is required (max 100 characters)'
    }

    if (data.authorUrl && !isValidUrl(data.authorUrl)) {
      errors.authorUrl = 'Must be a valid URL'
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }

    // Check if prompt exists
    existingPrompt = await prisma.prompts.findUnique({
      where: { id: data.id },
      include: {
        prompt_tags: true,
      },
    })

    if (!existingPrompt) {
      return { success: false, errors: { form: 'Prompt not found' } }
    }

    // Generate new slug if title changed
    newSlug = existingPrompt.slug
    if (data.title !== existingPrompt.title) {
      newSlug = await generateUniqueSlug(data.title, data.id)
    }

    // Get or create tags
    const tagRecords = await Promise.all(
      data.tags.map(async (tagName) => {
        const normalizedName = tagName.toLowerCase()
        const tagSlug = generateSlug(normalizedName)

        return prisma.tags.upsert({
          where: { name: normalizedName },
          update: {},
          create: {
            id: crypto.randomUUID(),
            name: normalizedName,
            slug: tagSlug,
          },
        })
      }),
    )

    // Update prompt in transaction
    await prisma.$transaction(async (tx) => {
      // Update prompt
      await tx.prompts.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: newSlug,
          prompt_text: data.promptText,
          category: data.category,
          description: data.description || null,
          example_output: data.exampleOutput || null,
          author_name: data.authorName,
          author_url: data.authorUrl || null,
          featured: data.featured,
        },
      })

      // Delete existing tag associations
      await tx.prompt_tags.deleteMany({
        where: { prompt_id: data.id },
      })

      // Create new tag associations
      await tx.prompt_tags.createMany({
        data: tagRecords.map((tag) => ({
          prompt_id: data.id,
          tag_id: tag.id,
        })),
      })
    })

  } catch (error) {
    logger.error(
      'Failed to update prompt',
      error as Error,
      { promptId: data.id }
    )
    return { success: false, errors: { form: 'Failed to update prompt' } }
  }

  // Revalidate relevant pages (outside try-catch to avoid catching redirect)
  revalidatePath(`/prompts/${existingPrompt.slug}`)
  revalidatePath(`/prompts/${newSlug}`)
  revalidatePath('/prompts')
  revalidatePath('/admin')
  revalidatePath('/admin/queue')
  revalidatePath('/')

  // Redirect based on prompt status
  // If pending, go back to queue; if approved, go to prompt page
  if (data.status === 'PENDING') {
    redirect('/admin/queue')
  } else {
    redirect(`/prompts/${newSlug}`)
  }
}
