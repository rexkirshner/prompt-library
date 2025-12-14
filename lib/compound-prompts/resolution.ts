/**
 * Compound Prompts Resolution Module
 *
 * Provides functions to resolve (expand) compound prompts to their final text.
 * This is the core functionality that converts a compound prompt's component
 * structure into the actual text that users see and copy.
 *
 * Resolution Process:
 * 1. Fetch the compound prompt and all its components
 * 2. For each component in order:
 *    a. Add custom_text_before if present
 *    b. If component references another prompt:
 *       - If it's a simple prompt, add its prompt_text
 *       - If it's a compound prompt, recursively resolve it
 *    c. Add custom_text_after if present
 * 3. Join all pieces together
 */

import type {
  CompoundPromptWithComponents,
  ResolutionResult,
} from './types'
import { InvalidComponentError, MaxDepthExceededError } from './types'
import { MAX_NESTING_DEPTH } from './validation'

/**
 * Resolves a compound prompt to its final text
 *
 * This is the main entry point for expanding compound prompts.
 * It recursively resolves all nested components and returns the final text
 * along with metadata about the resolution process.
 *
 * @param promptId - The ID of the prompt to resolve
 * @param getPromptWithComponents - Function to fetch a prompt with its components
 * @param currentDepth - Current recursion depth (used internally)
 * @param usedPromptIds - Set of prompt IDs used in resolution (used internally)
 * @returns ResolutionResult containing the resolved text and metadata
 * @throws MaxDepthExceededError if recursion exceeds MAX_NESTING_DEPTH
 * @throws InvalidComponentError if a referenced prompt is not found
 *
 * @example
 * ```typescript
 * const result = await resolveCompoundPrompt(
 *   promptId,
 *   async (id) => await prisma.prompts.findUnique({
 *     where: { id },
 *     include: {
 *       compound_components: {
 *         include: { component_prompt: true },
 *         orderBy: { position: 'asc' }
 *       }
 *     }
 *   })
 * )
 * console.log(result.resolved_text)
 * console.log(`Used ${result.used_prompt_ids.length} prompts`)
 * console.log(`Max depth: ${result.depth_reached}`)
 * ```
 */
export async function resolveCompoundPrompt(
  promptId: string,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>,
  currentDepth: number = 0,
  usedPromptIds: Set<string> = new Set()
): Promise<ResolutionResult> {
  // Check depth limit
  if (currentDepth > MAX_NESTING_DEPTH) {
    throw new MaxDepthExceededError(
      `Resolution exceeded maximum nesting depth of ${MAX_NESTING_DEPTH}`,
      MAX_NESTING_DEPTH,
      currentDepth
    )
  }

  // Fetch the prompt and its components
  const prompt = await getPromptWithComponents(promptId)
  if (!prompt) {
    throw new InvalidComponentError(`Prompt not found: ${promptId}`)
  }

  // Track that we used this prompt
  usedPromptIds.add(promptId)

  // Base case: simple (non-compound) prompt
  if (!prompt.is_compound) {
    return {
      resolved_text: prompt.prompt_text || '',
      depth_reached: currentDepth,
      used_prompt_ids: Array.from(usedPromptIds),
    }
  }

  // Recursive case: compound prompt
  // Resolve each component in order and join them
  const resolvedParts: string[] = []
  let maxDepthReached = currentDepth

  // Sort components by position (should already be sorted, but ensure it)
  const sortedComponents = [...prompt.compound_components].sort(
    (a, b) => a.position - b.position
  )

  for (const component of sortedComponents) {
    // Add custom text before if present
    if (component.custom_text_before) {
      resolvedParts.push(component.custom_text_before)
    }

    // Resolve the component prompt if present
    if (component.component_prompt_id) {
      const componentResult = await resolveCompoundPrompt(
        component.component_prompt_id,
        getPromptWithComponents,
        currentDepth + 1,
        usedPromptIds
      )

      resolvedParts.push(componentResult.resolved_text)
      maxDepthReached = Math.max(maxDepthReached, componentResult.depth_reached)

      // Merge the used prompt IDs
      componentResult.used_prompt_ids.forEach((id) => usedPromptIds.add(id))
    }

    // Add custom text after if present
    if (component.custom_text_after) {
      resolvedParts.push(component.custom_text_after)
    }
  }

  // Join all parts with newlines between different components
  // This ensures proper spacing between components
  const resolvedText = resolvedParts
    .filter((part) => part.trim().length > 0) // Remove empty parts
    .join('\n\n') // Join with double newline for readability

  return {
    resolved_text: resolvedText,
    depth_reached: maxDepthReached,
    used_prompt_ids: Array.from(usedPromptIds),
  }
}

/**
 * Resolves a prompt to its final text (works for both simple and compound prompts)
 *
 * This is a convenience wrapper around resolveCompoundPrompt that handles
 * both simple and compound prompts. For simple prompts, it just returns
 * the prompt_text. For compound prompts, it resolves them fully.
 *
 * @param promptId - The ID of the prompt to resolve
 * @param getPromptWithComponents - Function to fetch a prompt with its components
 * @returns The final resolved text
 *
 * @example
 * ```typescript
 * const text = await resolvePrompt(
 *   promptId,
 *   async (id) => await prisma.prompts.findUnique({
 *     where: { id },
 *     include: {
 *       compound_components: {
 *         include: { component_prompt: true },
 *         orderBy: { position: 'asc' }
 *       }
 *     }
 *   })
 * )
 * ```
 */
export async function resolvePrompt(
  promptId: string,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>
): Promise<string> {
  const result = await resolveCompoundPrompt(promptId, getPromptWithComponents)
  return result.resolved_text
}

/**
 * Preview how a set of components would resolve without saving them
 *
 * This is useful for showing users a preview of their compound prompt
 * before they save it. It doesn't require the components to be in the database.
 *
 * @param components - Array of components with their prompts loaded
 * @param getPromptWithComponents - Function to fetch prompts for nested resolution
 * @returns The resolved text preview
 *
 * @example
 * ```typescript
 * const preview = await previewComponents(
 *   [
 *     {
 *       position: 0,
 *       custom_text_before: 'Context: ',
 *       component_prompt_id: 'prompt-1',
 *       custom_text_after: null
 *     },
 *     {
 *       position: 1,
 *       custom_text_before: 'Task: ',
 *       component_prompt_id: 'prompt-2',
 *       custom_text_after: null
 *     }
 *   ],
 *   async (id) => await prisma.prompts.findUnique({ where: { id } })
 * )
 * ```
 */
export async function previewComponents(
  components: Array<{
    position: number
    custom_text_before: string | null
    component_prompt_id: string | null
    custom_text_after: string | null
  }>,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>
): Promise<string> {
  const resolvedParts: string[] = []

  // Sort components by position
  const sortedComponents = [...components].sort((a, b) => a.position - b.position)

  for (const component of sortedComponents) {
    // Add custom text before if present
    if (component.custom_text_before) {
      resolvedParts.push(component.custom_text_before)
    }

    // Resolve the component prompt if present
    if (component.component_prompt_id) {
      const text = await resolvePrompt(
        component.component_prompt_id,
        getPromptWithComponents
      )
      resolvedParts.push(text)
    }

    // Add custom text after if present
    if (component.custom_text_after) {
      resolvedParts.push(component.custom_text_after)
    }
  }

  // Join all parts with newlines between different components
  return resolvedParts
    .filter((part) => part.trim().length > 0)
    .join('\n\n')
}

/**
 * Gets a list of all base prompts used by a compound prompt
 *
 * This is useful for:
 * - Showing users which prompts are used in a compound
 * - Checking dependencies before deleting a prompt
 * - Tracking propagation when a base prompt is updated
 *
 * @param promptId - The ID of the compound prompt
 * @param getPromptWithComponents - Function to fetch a prompt with its components
 * @returns Array of unique prompt IDs used (including the compound itself)
 *
 * @example
 * ```typescript
 * const dependencies = await getPromptDependencies(
 *   compoundPromptId,
 *   async (id) => await prisma.prompts.findUnique({
 *     where: { id },
 *     include: { compound_components: { include: { component_prompt: true } } }
 *   })
 * )
 * console.log(`This compound uses ${dependencies.length} prompts`)
 * ```
 */
export async function getPromptDependencies(
  promptId: string,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>
): Promise<string[]> {
  const result = await resolveCompoundPrompt(promptId, getPromptWithComponents)
  return result.used_prompt_ids
}
