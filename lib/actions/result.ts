/**
 * Standardized Action Result Types
 *
 * Provides consistent return types for all server actions across the application.
 * Supports both form-based actions (with field-level errors) and simple actions
 * (with a single error message).
 *
 * @example Form action with field-level errors
 * ```typescript
 * const result = await submitForm(data)
 * if (!result.success) {
 *   // result.errors is Record<string, string>
 *   if (result.errors.email) showFieldError('email', result.errors.email)
 *   if (result.errors.form) showFormError(result.errors.form)
 * }
 * ```
 *
 * @example Simple action with single error
 * ```typescript
 * const result = await deleteItem(id)
 * if (!result.success) {
 *   // result.error is string
 *   showError(result.error)
 * }
 * ```
 */

/**
 * Base success result - common to all action results
 */
interface SuccessResult<TData = void> {
  success: true
  message?: string
  data?: TData
}

/**
 * Form error result - for actions with field-level validation
 * Uses Record<string, string> where keys are field names
 * Special key 'form' is used for general form-level errors
 */
interface FormErrorResult {
  success: false
  errors: Record<string, string>
  message?: never
  data?: never
}

/**
 * Simple error result - for actions with single error message
 */
interface SimpleErrorResult {
  success: false
  error: string
  message?: never
  data?: never
}

/**
 * Form Action Result - for form submissions with field-level validation
 *
 * @typeParam TData - Optional data type returned on success
 *
 * @example
 * ```typescript
 * async function submitPrompt(data: FormData): Promise<FormActionResult<{ id: string }>> {
 *   if (!data.title) {
 *     return formError({ title: 'Title is required' })
 *   }
 *   const prompt = await createPrompt(data)
 *   return success({ id: prompt.id }, 'Prompt created!')
 * }
 * ```
 */
export type FormActionResult<TData = void> = SuccessResult<TData> | FormErrorResult

/**
 * Simple Action Result - for non-form actions with single error message
 *
 * @typeParam TData - Optional data type returned on success
 *
 * @example
 * ```typescript
 * async function deletePrompt(id: string): Promise<SimpleActionResult> {
 *   try {
 *     await prisma.prompts.delete({ where: { id } })
 *     return success(undefined, 'Prompt deleted')
 *   } catch {
 *     return simpleError('Failed to delete prompt')
 *   }
 * }
 * ```
 */
export type SimpleActionResult<TData = void> = SuccessResult<TData> | SimpleErrorResult

/**
 * Generic Action Result - union of all result types
 * Use FormActionResult or SimpleActionResult for type-safe results
 */
export type ActionResult<TData = void> =
  | SuccessResult<TData>
  | FormErrorResult
  | SimpleErrorResult

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a success result
 *
 * @param data - Optional data to include in result
 * @param message - Optional success message
 * @returns Success result object
 *
 * @example
 * ```typescript
 * return success() // Simple success
 * return success(undefined, 'Done!') // With message
 * return success({ id: '123' }) // With data
 * return success({ id: '123' }, 'Created!') // With both
 * ```
 */
export function success<TData = void>(
  data?: TData,
  message?: string
): SuccessResult<TData> {
  const result: SuccessResult<TData> = { success: true }
  if (message !== undefined) result.message = message
  if (data !== undefined) result.data = data
  return result
}

/**
 * Create a form error result with field-level errors
 *
 * @param errors - Object mapping field names to error messages
 * @returns Form error result object
 *
 * @example
 * ```typescript
 * // Single field error
 * return formError({ email: 'Invalid email format' })
 *
 * // Multiple field errors
 * return formError({
 *   email: 'Invalid email',
 *   password: 'Password too short'
 * })
 *
 * // Form-level error (not tied to specific field)
 * return formError({ form: 'An unexpected error occurred' })
 * ```
 */
export function formError(errors: Record<string, string>): FormErrorResult {
  return { success: false, errors }
}

/**
 * Create a simple error result with single message
 *
 * @param error - Error message string
 * @returns Simple error result object
 *
 * @example
 * ```typescript
 * return simpleError('Not authorized')
 * return simpleError('Failed to delete item')
 * ```
 */
export function simpleError(error: string): SimpleErrorResult {
  return { success: false, error }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if result is a success
 *
 * @param result - Action result to check
 * @returns True if result is successful
 *
 * @example
 * ```typescript
 * const result = await submitForm(data)
 * if (isSuccess(result)) {
 *   // result.data is available here
 *   console.log('Success:', result.message)
 * }
 * ```
 */
export function isSuccess<TData>(
  result: ActionResult<TData>
): result is SuccessResult<TData> {
  return result.success === true
}

/**
 * Check if result is a form error (has field-level errors)
 *
 * @param result - Action result to check
 * @returns True if result is a form error
 *
 * @example
 * ```typescript
 * if (isFormError(result)) {
 *   // result.errors is Record<string, string>
 *   Object.entries(result.errors).forEach(([field, msg]) => {
 *     setFieldError(field, msg)
 *   })
 * }
 * ```
 */
export function isFormError(result: ActionResult): result is FormErrorResult {
  return result.success === false && 'errors' in result
}

/**
 * Check if result is a simple error (has single error message)
 *
 * @param result - Action result to check
 * @returns True if result is a simple error
 *
 * @example
 * ```typescript
 * if (isSimpleError(result)) {
 *   // result.error is string
 *   showToast(result.error, 'error')
 * }
 * ```
 */
export function isSimpleError(result: ActionResult): result is SimpleErrorResult {
  return result.success === false && 'error' in result
}

/**
 * Get error message from any error result
 *
 * For form errors, returns the 'form' field error or first field error.
 * For simple errors, returns the error string.
 *
 * @param result - Error result to extract message from
 * @returns Error message string
 *
 * @example
 * ```typescript
 * if (!result.success) {
 *   const message = getErrorMessage(result)
 *   showToast(message, 'error')
 * }
 * ```
 */
export function getErrorMessage(result: FormErrorResult | SimpleErrorResult): string {
  if ('error' in result) {
    return result.error
  }
  // For form errors, prefer 'form' key, then first error
  return result.errors.form || Object.values(result.errors)[0] || 'An error occurred'
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Wrap an async function to catch errors and return standardized results
 *
 * @param fn - Async function to wrap
 * @param errorMessage - Message for unexpected errors
 * @returns Wrapped function returning FormActionResult
 *
 * @example
 * ```typescript
 * const safeSubmit = withErrorHandling(
 *   async (data: FormData) => {
 *     const result = await prisma.prompts.create({ data })
 *     return success({ id: result.id })
 *   },
 *   'Failed to create prompt'
 * )
 *
 * // Usage
 * const result = await safeSubmit(data) // Never throws
 * ```
 */
export function withFormErrorHandling<TArgs extends unknown[], TData = void>(
  fn: (...args: TArgs) => Promise<FormActionResult<TData>>,
  errorMessage: string = 'An unexpected error occurred'
): (...args: TArgs) => Promise<FormActionResult<TData>> {
  return async (...args: TArgs): Promise<FormActionResult<TData>> => {
    try {
      return await fn(...args)
    } catch (error) {
      // Log error for debugging (assumes logger is available)
      console.error('[Action Error]', error)
      return formError({ form: errorMessage })
    }
  }
}

/**
 * Wrap an async function to catch errors and return simple results
 *
 * @param fn - Async function to wrap
 * @param errorMessage - Message for unexpected errors
 * @returns Wrapped function returning SimpleActionResult
 */
export function withSimpleErrorHandling<TArgs extends unknown[], TData = void>(
  fn: (...args: TArgs) => Promise<SimpleActionResult<TData>>,
  errorMessage: string = 'An unexpected error occurred'
): (...args: TArgs) => Promise<SimpleActionResult<TData>> {
  return async (...args: TArgs): Promise<SimpleActionResult<TData>> => {
    try {
      return await fn(...args)
    } catch (error) {
      console.error('[Action Error]', error)
      return simpleError(errorMessage)
    }
  }
}
