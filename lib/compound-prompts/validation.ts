/**
 * Compound Prompts Validation Module
 *
 * Provides validation functions for compound prompts including:
 * - Circular reference detection
 * - Maximum depth calculation
 * - Component validation
 *
 * These functions prevent invalid compound prompt configurations
 * and ensure the system stays within defined limits.
 */

import type {
  BasePrompt,
  CompoundPromptComponent,
  CompoundPromptWithComponents,
} from './types'
import {
  CircularReferenceError,
  MaxDepthExceededError,
  InvalidComponentError,
} from './types'

/**
 * Maximum allowed nesting depth for compound prompts
 * This prevents excessive recursion and performance issues
 */
export const MAX_NESTING_DEPTH = 5

/**
 * Detects circular references in a compound prompt's component graph
 *
 * Uses a depth-first search with a visited set to detect cycles.
 * A circular reference exists if we encounter a prompt ID that's
 * already in our current path.
 *
 * @param promptId - The ID of the prompt to check
 * @param getPromptWithComponents - Function to fetch a prompt with its components
 * @param visited - Set of prompt IDs in the current path (for recursion)
 * @param path - Array of prompt IDs in the current path (for error reporting)
 * @returns true if no circular reference is found
 * @throws CircularReferenceError if a circular reference is detected
 *
 * @example
 * ```typescript
 * // Check if adding a component would create a circular reference
 * await checkCircularReference(
 *   compoundPromptId,
 *   async (id) => await prisma.prompts.findUnique({
 *     where: { id },
 *     include: { compound_components: { include: { component_prompt: true } } }
 *   })
 * )
 * ```
 */
export async function checkCircularReference(
  promptId: string,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>,
  visited: Set<string> = new Set(),
  path: string[] = []
): Promise<boolean> {
  // If we've already visited this prompt in the current path, we have a cycle
  if (visited.has(promptId)) {
    throw new CircularReferenceError(
      `Circular reference detected: ${[...path, promptId].join(' → ')}`,
      [...path, promptId]
    )
  }

  // Fetch the prompt and its components
  const prompt = await getPromptWithComponents(promptId)
  if (!prompt) {
    throw new InvalidComponentError(`Prompt not found: ${promptId}`)
  }

  // If it's not a compound prompt, no further checking needed
  if (!prompt.is_compound || !prompt.compound_components) {
    return true
  }

  // Add this prompt to the visited set and path
  const newVisited = new Set(visited).add(promptId)
  const newPath = [...path, promptId]

  // Recursively check each component
  for (const component of prompt.compound_components) {
    // Skip components that are just custom text (no component_prompt_id)
    if (!component.component_prompt_id) {
      continue
    }

    // Recursively check this component
    await checkCircularReference(
      component.component_prompt_id,
      getPromptWithComponents,
      newVisited,
      newPath
    )
  }

  return true
}

/**
 * Calculates the maximum nesting depth of a compound prompt
 *
 * Recursively traverses the component tree to find the deepest path.
 * The depth of a simple (non-compound) prompt is 0.
 * The depth of a compound prompt is 1 + max(depth of its components).
 *
 * @param promptId - The ID of the prompt to calculate depth for
 * @param getPromptWithComponents - Function to fetch a prompt with its components
 * @param cache - Cache of already-calculated depths (for performance)
 * @returns The maximum depth of the prompt
 * @throws MaxDepthExceededError if the depth exceeds MAX_NESTING_DEPTH
 *
 * @example
 * ```typescript
 * const depth = await calculateMaxDepth(
 *   promptId,
 *   async (id) => await prisma.prompts.findUnique({
 *     where: { id },
 *     include: { compound_components: { include: { component_prompt: true } } }
 *   })
 * )
 * console.log(`This prompt has a nesting depth of ${depth}`)
 * ```
 */
export async function calculateMaxDepth(
  promptId: string,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>,
  cache: Map<string, number> = new Map()
): Promise<number> {
  // Check cache first
  if (cache.has(promptId)) {
    return cache.get(promptId)!
  }

  // Fetch the prompt and its components
  const prompt = await getPromptWithComponents(promptId)
  if (!prompt) {
    throw new InvalidComponentError(`Prompt not found: ${promptId}`)
  }

  // Base case: non-compound prompts have depth 0
  if (!prompt.is_compound || !prompt.compound_components || prompt.compound_components.length === 0) {
    cache.set(promptId, 0)
    return 0
  }

  // Recursive case: find the maximum depth among all components
  let maxComponentDepth = 0
  for (const component of prompt.compound_components) {
    // Skip components that are just custom text
    if (!component.component_prompt_id) {
      continue
    }

    const componentDepth = await calculateMaxDepth(
      component.component_prompt_id,
      getPromptWithComponents,
      cache
    )
    maxComponentDepth = Math.max(maxComponentDepth, componentDepth)
  }

  // This compound's depth is 1 + the max depth of its components
  const depth = 1 + maxComponentDepth

  // Check if we've exceeded the maximum allowed depth
  if (depth > MAX_NESTING_DEPTH) {
    throw new MaxDepthExceededError(
      `Maximum nesting depth of ${MAX_NESTING_DEPTH} exceeded. Actual depth: ${depth}`,
      MAX_NESTING_DEPTH,
      depth
    )
  }

  cache.set(promptId, depth)
  return depth
}

/**
 * Validates that adding a component to a compound prompt won't create issues
 *
 * Checks:
 * 1. The component prompt exists
 * 2. Adding it won't create a circular reference
 * 3. Adding it won't exceed the maximum depth
 *
 * @param compoundPromptId - The ID of the compound prompt
 * @param componentPromptId - The ID of the component to add
 * @param getPromptWithComponents - Function to fetch a prompt with its components
 * @returns true if the component can be safely added
 * @throws Error if validation fails
 *
 * @example
 * ```typescript
 * await validateComponent(
 *   compoundPromptId,
 *   componentPromptId,
 *   async (id) => await prisma.prompts.findUnique({
 *     where: { id },
 *     include: { compound_components: { include: { component_prompt: true } } }
 *   })
 * )
 * ```
 */
export async function validateComponent(
  compoundPromptId: string,
  componentPromptId: string,
  getPromptWithComponents: (id: string) => Promise<CompoundPromptWithComponents | null>
): Promise<boolean> {
  // Check that the component prompt exists
  const componentPrompt = await getPromptWithComponents(componentPromptId)
  if (!componentPrompt) {
    throw new InvalidComponentError(`Component prompt not found: ${componentPromptId}`)
  }

  // Check for self-reference
  if (compoundPromptId === componentPromptId) {
    throw new CircularReferenceError(
      'A prompt cannot reference itself',
      [compoundPromptId, componentPromptId]
    )
  }

  // For circular reference checking, we need to check if adding this component
  // would create a cycle. We do this by checking if the component (or any of its
  // nested components) references the compound prompt we're adding to.
  if (componentPrompt.is_compound) {
    await checkCircularReference(
      componentPromptId,
      getPromptWithComponents,
      new Set([compoundPromptId]), // Start with the compound prompt in visited
      [compoundPromptId]
    )
  }

  // Check depth limit
  // First get the depth of the component
  const componentDepth = await calculateMaxDepth(
    componentPromptId,
    getPromptWithComponents
  )

  // The new depth of the compound would be 1 + componentDepth
  // (assuming this is the deepest component)
  const newCompoundDepth = 1 + componentDepth
  if (newCompoundDepth > MAX_NESTING_DEPTH) {
    throw new MaxDepthExceededError(
      `Adding this component would exceed maximum nesting depth of ${MAX_NESTING_DEPTH}`,
      MAX_NESTING_DEPTH,
      newCompoundDepth
    )
  }

  return true
}

/**
 * Validates a complete set of components for a compound prompt
 *
 * Ensures:
 * 1. No duplicate positions
 * 2. Positions are consecutive starting from 0
 * 3. Each component either has a component_prompt_id OR custom text
 *
 * @param components - Array of components to validate
 * @returns true if all components are valid
 * @throws InvalidComponentError if validation fails
 */
export function validateComponentStructure(
  components: CompoundPromptComponent[]
): boolean {
  // Check for empty components array
  if (components.length === 0) {
    throw new InvalidComponentError('Compound prompt must have at least one component')
  }

  // Check positions are unique and consecutive
  const positions = components.map((c) => c.position).sort((a, b) => a - b)
  for (let i = 0; i < positions.length; i++) {
    if (positions[i] !== i) {
      throw new InvalidComponentError(
        `Component positions must be consecutive starting from 0. Expected ${i}, got ${positions[i]}`
      )
    }
  }

  // Check each component has either a component_prompt_id or custom text
  for (const component of components) {
    const hasPrompt = component.component_prompt_id !== null
    const hasCustomText =
      component.custom_text_before !== null || component.custom_text_after !== null

    if (!hasPrompt && !hasCustomText) {
      throw new InvalidComponentError(
        `Component at position ${component.position} has neither a component prompt nor custom text`
      )
    }
  }

  return true
}
