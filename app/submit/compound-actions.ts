/**
 * Public Compound Prompt Submission Actions
 *
 * Server actions for submitting compound prompts (public submissions).
 * Similar to admin actions but without admin requirement.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/client'
import { generateSlug, generateUniqueSlug, normalizeTag, isValidTag } from '@/lib/prompts/validation'
import {
  calculateMaxDepth,
  validateComponentStructure,
  getPromptWithComponents,
} from '@/lib/compound-prompts'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'submit/compound-actions' })

export interface CompoundSubmissionResult {
  success: boolean
  errors?: {
    title?: string
    description?: string
    category?: string
    components?: string
    authorName?: string
    form?: string
  }
  message?: string
}

export interface ComponentData {
  position: number
  component_prompt_id: string | null
  custom_text_before: string | null
  custom_text_after: string | null
}

export interface SubmitCompoundPromptData {
  title: string
  description: string
  category: string
  components: ComponentData[]
  authorName: string
  authorUrl: string
  tags: string[]
}

/**
 * Check if a slug exists in the database
 * Used with generateUniqueSlug from lib/prompts/validation
 */
async function checkSlugExists(slug: string): Promise<boolean> {
  const existing = await prisma.prompts.findUnique({
    where: { slug },
  })
  return existing !== null
}

/**
 * Submit a new compound prompt (public submission)
 *
 * @param data - Compound prompt data including components
 * @returns Result with success status and any errors
 */
export async function submitCompoundPrompt(
  data: SubmitCompoundPromptData,
): Promise<CompoundSubmissionResult> {
  try {
    // Validate basic fields
    const errors: CompoundSubmissionResult['errors'] = {}

    if (!data.title || data.title.length < 10 || data.title.length > 100) {
      errors.title = 'Title must be between 10 and 100 characters'
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    if (!data.category) {
      errors.category = 'Category is required'
    }

    if (!data.authorName || data.authorName.length < 2) {
      errors.authorName = 'Author name is required (at least 2 characters)'
    }

    if (!data.components || data.components.length === 0) {
      errors.components = 'Must have at least one component'
    }

    if (data.tags.length < 1 || data.tags.length > 5) {
      errors.form = 'Must have 1-5 tags'
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }

    // Validate component structure
    try {
      validateComponentStructure(
        data.components.map((c, i) => ({
          id: `temp-${i}`,
          compound_prompt_id: 'temp',
          component_prompt_id: c.component_prompt_id,
          position: c.position,
          custom_text_before: c.custom_text_before,
          custom_text_after: c.custom_text_after,
          created_at: new Date(),
        })),
      )
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, errors: { components: message } }
    }

    // Validate depth for each component
    for (const component of data.components) {
      if (component.component_prompt_id) {
        try {
          const componentPrompt = await getPromptWithComponents(
            component.component_prompt_id,
          )
          if (componentPrompt && componentPrompt.is_compound) {
            const componentDepth = await calculateMaxDepth(
              component.component_prompt_id,
              getPromptWithComponents,
            )
            // Adding this would create depth of 1 + componentDepth
            if (1 + componentDepth > 5) {
              return {
                success: false,
                errors: {
                  components: `Component would exceed maximum nesting depth of 5`,
                },
              }
            }
          }
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error'
          return { success: false, errors: { components: message } }
        }
      }
    }

    // Generate slug
    const slug = await generateUniqueSlug(data.title, checkSlugExists)

    // Get or create tags (with defense-in-depth validation)
    const tagRecords = await Promise.all(
      data.tags
        .map((tagName) => normalizeTag(tagName))
        .filter((normalizedName) => {
          if (!isValidTag(normalizedName)) {
            logger.warn('Tag failed validation after normalization', {
              normalized: normalizedName,
            })
            return false
          }
          return true
        })
        .map(async (normalizedName) => {
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

    // Create compound prompt in transaction
    const prompt = await prisma.$transaction(async (tx) => {
      // Create the prompt with PENDING status
      const prompt = await tx.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: data.title,
          slug,
          description: data.description || null,
          category: data.category,
          author_name: data.authorName,
          author_url: data.authorUrl || null,
          prompt_text: null,
          example_output: null,
          is_compound: true,
          status: 'PENDING', // Public submissions are pending
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      // Create components
      await tx.compound_prompt_components.createMany({
        data: data.components.map((c) => ({
          id: crypto.randomUUID(),
          compound_prompt_id: prompt.id,
          component_prompt_id: c.component_prompt_id,
          position: c.position,
          custom_text_before: c.custom_text_before,
          custom_text_after: c.custom_text_after,
        })),
      })

      // Create tag associations
      await tx.prompt_tags.createMany({
        data: tagRecords.map((tag) => ({
          prompt_id: prompt.id,
          tag_id: tag.id,
        })),
      })

      return prompt
    })

    // Calculate and set max_depth AFTER transaction commits
    // This ensures the components are visible to getPromptWithComponents
    try {
      const depth = await calculateMaxDepth(prompt.id, getPromptWithComponents)
      await prisma.prompts.update({
        where: { id: prompt.id },
        data: { max_depth: depth },
      })
    } catch {
      // If calculation fails, leave max_depth as null
      // This is non-critical, so we don't fail the entire submission
    }

    // Revalidate paths
    revalidatePath('/submit')
    revalidatePath('/admin/queue')

    return {
      success: true,
      message:
        'Compound prompt submitted successfully! It will be reviewed by moderators before publication.',
    }
  } catch (error: unknown) {
    logger.error('Error submitting compound prompt', error instanceof Error ? error : new Error(String(error)))
    const message = error instanceof Error ? error.message : 'Failed to submit compound prompt'
    return {
      success: false,
      errors: { form: message },
    }
  }
}
