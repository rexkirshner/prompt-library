/**
 * Compound Prompts Type Definitions
 *
 * This module defines the core types used throughout the compound prompts feature.
 * These types align with the Prisma schema and provide type safety for all operations.
 */

/**
 * Component of a compound prompt
 * Represents a single piece (base prompt or custom text) within a compound prompt
 */
export interface CompoundPromptComponent {
  id: string
  compound_prompt_id: string
  component_prompt_id: string | null
  position: number
  custom_text_before: string | null
  custom_text_after: string | null
  created_at: Date
}

/**
 * Base prompt data needed for resolution
 * Only includes fields required to resolve the final text
 */
export interface BasePrompt {
  id: string
  prompt_text: string | null
  is_compound: boolean
  max_depth: number | null
  compound_components?: CompoundPromptComponent[]
}

/**
 * Full compound prompt with all components loaded
 */
export interface CompoundPromptWithComponents extends BasePrompt {
  compound_components: (CompoundPromptComponent & {
    component_prompt: BasePrompt | null
  })[]
}

/**
 * Result of resolving a compound prompt to its final text
 */
export interface ResolutionResult {
  /**
   * The fully resolved prompt text with all components expanded
   */
  resolved_text: string

  /**
   * The actual depth reached during resolution
   */
  depth_reached: number

  /**
   * IDs of all base prompts used in the resolution
   * Useful for tracking dependencies
   */
  used_prompt_ids: string[]
}

/**
 * Error types that can occur during compound prompt operations
 */
export class CompoundPromptError extends Error {
  constructor(message: string, public code: string, public details?: unknown) {
    super(message)
    this.name = 'CompoundPromptError'
  }
}

/**
 * Circular reference detected during validation
 */
export class CircularReferenceError extends CompoundPromptError {
  constructor(message: string, public path: string[]) {
    super(message, 'CIRCULAR_REFERENCE', { path })
    this.name = 'CircularReferenceError'
  }
}

/**
 * Maximum depth exceeded during validation or resolution
 */
export class MaxDepthExceededError extends CompoundPromptError {
  constructor(message: string, public maxDepth: number, public actualDepth: number) {
    super(message, 'MAX_DEPTH_EXCEEDED', { maxDepth, actualDepth })
    this.name = 'MaxDepthExceededError'
  }
}

/**
 * Invalid component configuration
 */
export class InvalidComponentError extends CompoundPromptError {
  constructor(message: string, details?: unknown) {
    super(message, 'INVALID_COMPONENT', details)
    this.name = 'InvalidComponentError'
  }
}
