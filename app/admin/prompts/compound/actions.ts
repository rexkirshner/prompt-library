/**
 * Admin Compound Prompt Actions
 *
 * Server actions for creating and updating compound prompts.
 * Includes validation for circular references and depth limits.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { getAdminUser } from '@/lib/auth/admin'
import { generateSlug } from '@/lib/prompts/validation'
import {
  validateComponent,
  calculateMaxDepth,
  validateComponentStructure,
} from '@/lib/compound-prompts/validation'
import { previewComponents } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'admin/prompts/compound/actions' })

export interface CompoundPromptResult {
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
  promptId?: string
}

export interface ComponentData {
  position: number
  component_prompt_id: string | null
  custom_text_before: string | null
  custom_text_after: string | null
}

export interface CreateCompoundPromptData {
  title: string
  description: string
  category: string
  components: ComponentData[]
  authorName: string
  tags: string[]
}

export interface UpdateCompoundPromptData extends CreateCompoundPromptData {
  id: string
  slug: string
  status: string
}

/**
 * Helper to fetch prompt with components for validation
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
 * Generate unique slug for compound prompt
 */
async function generateUniqueSlug(title: string, excludeId?: string): Promise<string> {
  const MAX_SLUG_ATTEMPTS = 100
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const existing = await prisma.prompts.findUnique({
      where: { slug },
    })

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug
    }

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
 * Create a new compound prompt
 *
 * @param data - Compound prompt data including components
 * @returns Result with success status and any errors
 */
export async function createCompoundPrompt(
  data: CreateCompoundPromptData,
): Promise<CompoundPromptResult> {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, errors: { form: 'Unauthorized: Admin access required' } }
    }

    // Validate basic fields
    const errors: CompoundPromptResult['errors'] = {}

    if (!data.title || data.title.length < 10 || data.title.length > 100) {
      errors.title = 'Title must be between 10 and 100 characters'
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    if (!data.category) {
      errors.category = 'Category is required'
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
    } catch (error: any) {
      return { success: false, errors: { components: error.message } }
    }

    // Validate each component (circular ref & depth)
    for (const component of data.components) {
      if (component.component_prompt_id) {
        try {
          // For new compound, we can't check circular refs against itself yet
          // But we can check if adding this component would exceed depth
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
                  components: `Component "${component.component_prompt_id}" would exceed maximum depth`,
                },
              }
            }
          }
        } catch (error: any) {
          return { success: false, errors: { components: error.message } }
        }
      }
    }

    // Generate slug
    const slug = await generateUniqueSlug(data.title)

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

    // Create compound prompt in transaction
    const compoundPrompt = await prisma.$transaction(async (tx) => {
      // Create the prompt
      const prompt = await tx.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: data.title,
          slug,
          description: data.description || null,
          category: data.category,
          author_name: data.authorName,
          author_url: null,
          prompt_text: null,
          example_output: null,
          is_compound: true,
          status: 'PENDING',
          submitted_by_user_id: admin.id,
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

      // Calculate and set max_depth
      try {
        const depth = await calculateMaxDepth(prompt.id, getPromptWithComponents)
        await tx.prompts.update({
          where: { id: prompt.id },
          data: { max_depth: depth },
        })
      } catch {
        // If calculation fails, leave max_depth as null
      }

      // Create tag associations
      await tx.prompt_tags.createMany({
        data: tagRecords.map((tag) => ({
          prompt_id: prompt.id,
          tag_id: tag.id,
        })),
      })

      return prompt
    })

    // Revalidate paths
    revalidatePath('/admin')
    revalidatePath('/admin/queue')
    revalidatePath('/admin/prompts')

    return {
      success: true,
      message: 'Compound prompt created successfully',
      promptId: compoundPrompt.id,
    }
  } catch (error) {
    logger.error(
      'Failed to create compound prompt',
      error as Error,
      { title: data.title, componentCount: data.components.length }
    )
    return { success: false, errors: { form: 'Failed to create compound prompt' } }
  }
}

/**
 * Update an existing compound prompt
 *
 * @param data - Updated compound prompt data
 * @returns Result with success status and any errors
 */
export async function updateCompoundPrompt(
  data: UpdateCompoundPromptData,
): Promise<CompoundPromptResult> {
  // Declare variables outside try-catch for redirect
  let newSlug: string = data.slug

  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, errors: { form: 'Unauthorized: Admin access required' } }
    }

    // Validate basic fields (same as create)
    const errors: CompoundPromptResult['errors'] = {}

    if (!data.title || data.title.length < 10 || data.title.length > 100) {
      errors.title = 'Title must be between 10 and 100 characters'
    }

    if (data.description && data.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    if (!data.category) {
      errors.category = 'Category is required'
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

    // Check if prompt exists
    const existingPrompt = await prisma.prompts.findUnique({
      where: { id: data.id },
    })

    if (!existingPrompt) {
      return { success: false, errors: { form: 'Prompt not found' } }
    }

    if (!existingPrompt.is_compound) {
      return { success: false, errors: { form: 'This is not a compound prompt' } }
    }

    // Validate component structure
    try {
      validateComponentStructure(
        data.components.map((c, i) => ({
          id: `temp-${i}`,
          compound_prompt_id: data.id,
          component_prompt_id: c.component_prompt_id,
          position: c.position,
          custom_text_before: c.custom_text_before,
          custom_text_after: c.custom_text_after,
          created_at: new Date(),
        })),
      )
    } catch (error: any) {
      return { success: false, errors: { components: error.message } }
    }

    // Validate each component
    for (const component of data.components) {
      if (component.component_prompt_id) {
        try {
          await validateComponent(
            data.id,
            component.component_prompt_id,
            getPromptWithComponents,
          )
        } catch (error: any) {
          return { success: false, errors: { components: error.message } }
        }
      }
    }

    // Generate new slug if title changed
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

    // Update compound prompt in transaction
    await prisma.$transaction(async (tx) => {
      // Update basic fields
      await tx.prompts.update({
        where: { id: data.id },
        data: {
          title: data.title,
          slug: newSlug,
          description: data.description || null,
          category: data.category,
          author_name: data.authorName,
          updated_at: new Date(),
        },
      })

      // Delete existing components
      await tx.compound_prompt_components.deleteMany({
        where: { compound_prompt_id: data.id },
      })

      // Create new components
      await tx.compound_prompt_components.createMany({
        data: data.components.map((c) => ({
          id: crypto.randomUUID(),
          compound_prompt_id: data.id,
          component_prompt_id: c.component_prompt_id,
          position: c.position,
          custom_text_before: c.custom_text_before,
          custom_text_after: c.custom_text_after,
        })),
      })

      // Recalculate max_depth
      try {
        const depth = await calculateMaxDepth(data.id, getPromptWithComponents)
        await tx.prompts.update({
          where: { id: data.id },
          data: { max_depth: depth },
        })
      } catch {
        // If calculation fails, leave existing max_depth
      }

      // Update tag associations
      await tx.prompt_tags.deleteMany({
        where: { prompt_id: data.id },
      })

      await tx.prompt_tags.createMany({
        data: tagRecords.map((tag) => ({
          prompt_id: data.id,
          tag_id: tag.id,
        })),
      })
    })
  } catch (error) {
    logger.error(
      'Failed to update compound prompt',
      error as Error,
      { promptId: data.id, componentCount: data.components.length }
    )
    return { success: false, errors: { form: 'Failed to update compound prompt' } }
  }

  // Revalidate paths (outside try-catch to avoid catching redirect)
  revalidatePath(`/prompts/${data.slug}`)
  revalidatePath(`/prompts/${newSlug}`)
  revalidatePath('/prompts')
  revalidatePath('/admin')
  revalidatePath('/admin/queue')

  // Redirect based on status
  if (data.status === 'PENDING') {
    redirect('/admin/queue')
  } else {
    redirect(`/prompts/${newSlug}`)
  }
}

/**
 * Preview how components will resolve
 *
 * @param components - Array of components to preview
 * @returns Resolved text preview
 */
export async function previewCompoundPrompt(
  components: ComponentData[],
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    const text = await previewComponents(components, getPromptWithComponents)
    return { success: true, text }
  } catch (error: any) {
    logger.error(
      'Failed to preview compound prompt',
      error as Error,
      { componentCount: components.length }
    )
    return { success: false, error: error.message || 'Failed to preview' }
  }
}
