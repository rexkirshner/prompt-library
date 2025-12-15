/**
 * Actions Module
 *
 * Standardized types and utilities for server actions.
 *
 * @example
 * ```typescript
 * import {
 *   FormActionResult,
 *   SimpleActionResult,
 *   success,
 *   formError,
 *   simpleError,
 *   isSuccess,
 * } from '@/lib/actions'
 * ```
 */

export {
  // Types
  type FormActionResult,
  type SimpleActionResult,
  type ActionResult,
  // Helper functions
  success,
  formError,
  simpleError,
  // Type guards
  isSuccess,
  isFormError,
  isSimpleError,
  getErrorMessage,
  // Wrappers
  withFormErrorHandling,
  withSimpleErrorHandling,
} from './result'
