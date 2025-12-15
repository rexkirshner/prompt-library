/**
 * Tests for Action Result Utilities
 *
 * Tests standardized action result types, helper functions,
 * type guards, and error handling wrappers.
 */

import {
  FormActionResult,
  SimpleActionResult,
  success,
  formError,
  simpleError,
  isSuccess,
  isFormError,
  isSimpleError,
  getErrorMessage,
  withFormErrorHandling,
  withSimpleErrorHandling,
} from '../result'

describe('Action Result Utilities', () => {
  // ==========================================================================
  // Helper Functions
  // ==========================================================================

  describe('success()', () => {
    it('should create a basic success result', () => {
      const result = success()

      expect(result.success).toBe(true)
      expect(result.message).toBeUndefined()
      expect(result.data).toBeUndefined()
    })

    it('should create a success result with message', () => {
      const result = success(undefined, 'Operation completed')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Operation completed')
      expect(result.data).toBeUndefined()
    })

    it('should create a success result with data', () => {
      const result = success({ id: '123', name: 'Test' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: '123', name: 'Test' })
      expect(result.message).toBeUndefined()
    })

    it('should create a success result with both data and message', () => {
      const result = success({ id: '123' }, 'Created successfully')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: '123' })
      expect(result.message).toBe('Created successfully')
    })

    it('should preserve data type', () => {
      interface User {
        id: string
        email: string
      }
      const userData: User = { id: '1', email: 'test@example.com' }
      const result = success<User>(userData)

      expect(result.data?.id).toBe('1')
      expect(result.data?.email).toBe('test@example.com')
    })
  })

  describe('formError()', () => {
    it('should create a form error with single field', () => {
      const result = formError({ email: 'Invalid email format' })

      expect(result.success).toBe(false)
      expect(result.errors).toEqual({ email: 'Invalid email format' })
    })

    it('should create a form error with multiple fields', () => {
      const result = formError({
        email: 'Invalid email',
        password: 'Password too short',
        name: 'Name is required',
      })

      expect(result.success).toBe(false)
      expect(result.errors.email).toBe('Invalid email')
      expect(result.errors.password).toBe('Password too short')
      expect(result.errors.name).toBe('Name is required')
    })

    it('should create a form-level error with "form" key', () => {
      const result = formError({ form: 'An unexpected error occurred' })

      expect(result.success).toBe(false)
      expect(result.errors.form).toBe('An unexpected error occurred')
    })

    it('should handle empty errors object', () => {
      const result = formError({})

      expect(result.success).toBe(false)
      expect(result.errors).toEqual({})
    })
  })

  describe('simpleError()', () => {
    it('should create a simple error result', () => {
      const result = simpleError('Something went wrong')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Something went wrong')
    })

    it('should handle empty string', () => {
      const result = simpleError('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('')
    })
  })

  // ==========================================================================
  // Type Guards
  // ==========================================================================

  describe('isSuccess()', () => {
    it('should return true for success result', () => {
      const result = success({ id: '123' })

      expect(isSuccess(result)).toBe(true)
    })

    it('should return false for form error result', () => {
      const result = formError({ email: 'Invalid' })

      expect(isSuccess(result)).toBe(false)
    })

    it('should return false for simple error result', () => {
      const result = simpleError('Error')

      expect(isSuccess(result)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const result: FormActionResult<{ id: string }> = success({ id: '123' })

      if (isSuccess(result)) {
        // TypeScript should know result.data is available
        expect(result.data?.id).toBe('123')
      }
    })
  })

  describe('isFormError()', () => {
    it('should return true for form error result', () => {
      const result = formError({ email: 'Invalid' })

      expect(isFormError(result)).toBe(true)
    })

    it('should return false for success result', () => {
      const result = success()

      expect(isFormError(result)).toBe(false)
    })

    it('should return false for simple error result', () => {
      const result = simpleError('Error')

      expect(isFormError(result)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const result: FormActionResult = formError({ email: 'Invalid email' })

      if (isFormError(result)) {
        // TypeScript should know result.errors is available
        expect(result.errors.email).toBe('Invalid email')
      }
    })
  })

  describe('isSimpleError()', () => {
    it('should return true for simple error result', () => {
      const result = simpleError('Error')

      expect(isSimpleError(result)).toBe(true)
    })

    it('should return false for success result', () => {
      const result = success()

      expect(isSimpleError(result)).toBe(false)
    })

    it('should return false for form error result', () => {
      const result = formError({ email: 'Invalid' })

      expect(isSimpleError(result)).toBe(false)
    })

    it('should narrow type correctly', () => {
      const result: SimpleActionResult = simpleError('Something went wrong')

      if (isSimpleError(result)) {
        // TypeScript should know result.error is available
        expect(result.error).toBe('Something went wrong')
      }
    })
  })

  describe('getErrorMessage()', () => {
    it('should return error from simple error result', () => {
      const result = simpleError('Something went wrong')

      expect(getErrorMessage(result)).toBe('Something went wrong')
    })

    it('should return form key error when present', () => {
      const result = formError({
        email: 'Invalid email',
        form: 'General form error',
      })

      expect(getErrorMessage(result)).toBe('General form error')
    })

    it('should return first field error when no form key', () => {
      const result = formError({
        email: 'Invalid email',
        password: 'Too short',
      })

      // Should return one of the field errors
      const message = getErrorMessage(result)
      expect(['Invalid email', 'Too short']).toContain(message)
    })

    it('should return default message for empty errors', () => {
      const result = formError({})

      expect(getErrorMessage(result)).toBe('An error occurred')
    })
  })

  // ==========================================================================
  // Wrapper Functions
  // ==========================================================================

  describe('withFormErrorHandling()', () => {
    it('should return success result when function succeeds', async () => {
      const fn = async (value: string): Promise<FormActionResult<{ value: string }>> => {
        return success({ value }, 'Processed')
      }

      const wrapped = withFormErrorHandling(fn)
      const result = await wrapped('test')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data?.value).toBe('test')
        expect(result.message).toBe('Processed')
      }
    })

    it('should return form error when function throws', async () => {
      const fn = async (): Promise<FormActionResult> => {
        throw new Error('Database connection failed')
      }

      const wrapped = withFormErrorHandling(fn, 'Failed to process')
      const result = await wrapped()

      expect(isFormError(result)).toBe(true)
      if (isFormError(result)) {
        expect(result.errors.form).toBe('Failed to process')
      }
    })

    it('should use default error message when not provided', async () => {
      const fn = async (): Promise<FormActionResult> => {
        throw new Error('Unexpected')
      }

      const wrapped = withFormErrorHandling(fn)
      const result = await wrapped()

      expect(isFormError(result)).toBe(true)
      if (isFormError(result)) {
        expect(result.errors.form).toBe('An unexpected error occurred')
      }
    })

    it('should preserve function arguments', async () => {
      const fn = async (
        a: string,
        b: number,
        c: boolean
      ): Promise<FormActionResult<{ result: string }>> => {
        return success({ result: `${a}-${b}-${c}` })
      }

      const wrapped = withFormErrorHandling(fn)
      const result = await wrapped('hello', 42, true)

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data?.result).toBe('hello-42-true')
      }
    })

    it('should handle non-Error throws', async () => {
      const fn = async (): Promise<FormActionResult> => {
        throw 'string error' // eslint-disable-line no-throw-literal
      }

      const wrapped = withFormErrorHandling(fn, 'Custom error')
      const result = await wrapped()

      expect(isFormError(result)).toBe(true)
      if (isFormError(result)) {
        expect(result.errors.form).toBe('Custom error')
      }
    })
  })

  describe('withSimpleErrorHandling()', () => {
    it('should return success result when function succeeds', async () => {
      const fn = async (id: string): Promise<SimpleActionResult<{ deleted: boolean }>> => {
        return success({ deleted: true }, `Deleted ${id}`)
      }

      const wrapped = withSimpleErrorHandling(fn)
      const result = await wrapped('123')

      expect(isSuccess(result)).toBe(true)
      if (isSuccess(result)) {
        expect(result.data?.deleted).toBe(true)
        expect(result.message).toBe('Deleted 123')
      }
    })

    it('should return simple error when function throws', async () => {
      const fn = async (): Promise<SimpleActionResult> => {
        throw new Error('Not found')
      }

      const wrapped = withSimpleErrorHandling(fn, 'Failed to delete')
      const result = await wrapped()

      expect(isSimpleError(result)).toBe(true)
      if (isSimpleError(result)) {
        expect(result.error).toBe('Failed to delete')
      }
    })

    it('should use default error message when not provided', async () => {
      const fn = async (): Promise<SimpleActionResult> => {
        throw new Error('Unexpected')
      }

      const wrapped = withSimpleErrorHandling(fn)
      const result = await wrapped()

      expect(isSimpleError(result)).toBe(true)
      if (isSimpleError(result)) {
        expect(result.error).toBe('An unexpected error occurred')
      }
    })
  })

  // ==========================================================================
  // Integration Tests
  // ==========================================================================

  describe('Integration', () => {
    it('should work in typical form action pattern', async () => {
      // Simulate a form submission action
      async function submitForm(data: {
        email: string
        password: string
      }): Promise<FormActionResult<{ userId: string }>> {
        // Validation
        if (!data.email.includes('@')) {
          return formError({ email: 'Invalid email format' })
        }
        if (data.password.length < 8) {
          return formError({ password: 'Password must be at least 8 characters' })
        }

        // Success
        return success({ userId: 'new-user-123' }, 'Account created!')
      }

      // Test validation error
      const invalidResult = await submitForm({ email: 'bad', password: '123' })
      expect(isFormError(invalidResult)).toBe(true)
      if (isFormError(invalidResult)) {
        expect(invalidResult.errors.email).toBe('Invalid email format')
      }

      // Test success
      const validResult = await submitForm({
        email: 'test@example.com',
        password: 'securepassword123',
      })
      expect(isSuccess(validResult)).toBe(true)
      if (isSuccess(validResult)) {
        expect(validResult.data?.userId).toBe('new-user-123')
      }
    })

    it('should work in typical simple action pattern', async () => {
      // Simulate a delete action
      async function deleteItem(id: string): Promise<SimpleActionResult> {
        if (!id) {
          return simpleError('ID is required')
        }
        if (id === 'protected') {
          return simpleError('Cannot delete protected item')
        }

        return success(undefined, 'Item deleted')
      }

      // Test error
      const errorResult = await deleteItem('protected')
      expect(isSimpleError(errorResult)).toBe(true)
      if (isSimpleError(errorResult)) {
        expect(errorResult.error).toBe('Cannot delete protected item')
      }

      // Test success
      const successResult = await deleteItem('regular-id')
      expect(isSuccess(successResult)).toBe(true)
    })

    it('should handle error message extraction consistently', () => {
      // Create both types of errors
      const formErr = formError({ email: 'Invalid', form: 'General error' })
      const simpleErr = simpleError('Simple error message')

      // Both should be extractable with getErrorMessage
      expect(getErrorMessage(formErr)).toBe('General error')
      expect(getErrorMessage(simpleErr)).toBe('Simple error message')
    })
  })
})
