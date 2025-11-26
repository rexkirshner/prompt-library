/**
 * Compound Prompts Module
 *
 * Public API for compound prompts functionality.
 * This module provides all the tools needed to work with compound prompts.
 */

// Export types
export type {
  CompoundPromptComponent,
  BasePrompt,
  CompoundPromptWithComponents,
  ResolutionResult,
} from './types'

export {
  CompoundPromptError,
  CircularReferenceError,
  MaxDepthExceededError,
  InvalidComponentError,
} from './types'

// Export validation functions
export {
  MAX_NESTING_DEPTH,
  checkCircularReference,
  calculateMaxDepth,
  validateComponent,
  validateComponentStructure,
} from './validation'

// Export resolution functions
export {
  resolveCompoundPrompt,
  resolvePrompt,
  previewComponents,
  getPromptDependencies,
} from './resolution'
