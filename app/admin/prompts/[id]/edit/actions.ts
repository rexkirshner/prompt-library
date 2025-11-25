/**
 * Admin Edit Prompt Actions
 *
 * Server actions for updating existing prompts.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { getAdminUser } from '@/lib/auth/admin'
import { generateSlug } from '@/lib/prompts/validation'

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
  tags: string[]
}

/**
 * Generate unique slug for prompt, excluding a specific prompt ID
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
 * Update an existing prompt
 */
export async function updatePrompt(
  data: EditPromptData,
): Promise<EditPromptResult> {
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
    const existingPrompt = await prisma.prompts.findUnique({
      where: { id: data.id },
      include: {
        prompt_tags: true,
      },
    })

    if (!existingPrompt) {
      return { success: false, errors: { form: 'Prompt not found' } }
    }

    // Generate new slug if title changed
    let newSlug = existingPrompt.slug
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

    // Revalidate relevant pages
    revalidatePath(`/prompts/${existingPrompt.slug}`)
    revalidatePath(`/prompts/${newSlug}`)
    revalidatePath('/prompts')
    revalidatePath('/admin')
    revalidatePath('/admin/queue')

    // Redirect based on prompt status
    // If pending, go back to queue; if approved, go to prompt page
    if (data.status === 'PENDING') {
      redirect('/admin/queue')
    } else {
      redirect(`/prompts/${newSlug}`)
    }
  } catch (error) {
    console.error('Failed to update prompt:', error)
    return { success: false, errors: { form: 'Failed to update prompt' } }
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}
