/**
 * Compound Prompt Fetcher
 *
 * Shared utility for fetching prompts with their compound components.
 * Used by validation, resolution, and various action handlers.
 */

import { prisma } from '@/lib/db/client'
import type { CompoundPromptWithComponents } from './types'

/**
 * Fetch a prompt with its compound components
 *
 * This is the canonical implementation used throughout the codebase
 * for fetching prompts with their component relationships.
 *
 * @param id - The prompt UUID
 * @returns The prompt with components, or null if not found
 *
 * @example
 * ```typescript
 * const prompt = await getPromptWithComponents('uuid-here')
 * if (prompt?.is_compound) {
 *   console.log(`Compound prompt with ${prompt.compound_components.length} components`)
 * }
 * ```
 */
export async function getPromptWithComponents(
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
      id: comp.id,
      compound_prompt_id: comp.compound_prompt_id,
      component_prompt_id: comp.component_prompt_id,
      position: comp.position,
      custom_text_before: comp.custom_text_before,
      custom_text_after: comp.custom_text_after,
      created_at: comp.created_at,
      component_prompt: comp.component_prompt
        ? {
            id: comp.component_prompt.id,
            prompt_text: comp.component_prompt.prompt_text,
            is_compound: comp.component_prompt.is_compound,
            max_depth: comp.component_prompt.max_depth,
            title: comp.component_prompt.title,
            slug: comp.component_prompt.slug,
          }
        : null,
    })),
  }
}
