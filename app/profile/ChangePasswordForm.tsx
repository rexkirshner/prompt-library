/**
 * Change Password Form Component
 *
 * Client component for changing user password with validation.
 */

'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { changePassword, type ChangePasswordResult } from './actions'

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Changing password...' : 'Change Password'}
    </button>
  )
}

/**
 * Change password form with validation and error handling
 */
export function ChangePasswordForm() {
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (
    prevState: ChangePasswordResult | null,
    formData: FormData,
  ): Promise<ChangePasswordResult> => {
    setShowSuccess(false)

    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    const result = await changePassword(currentPassword, newPassword, confirmPassword)

    if (result.success) {
      setShowSuccess(true)
      // Reset form on success
      const form = document.querySelector('form') as HTMLFormElement
      form?.reset()
    }

    return result
  }

  const [state, formAction] = useActionState<ChangePasswordResult | null, FormData>(
    handleSubmit,
    null,
  )

  return (
    <div className="space-y-6">
      {/* Success message */}
      {showSuccess && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-800 dark:text-green-300">
            Password changed successfully!
          </p>
        </div>
      )}

      {/* Form-level error */}
      {state?.errors?.form && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{state.errors.form}</p>
        </div>
      )}

      <form action={formAction} className="space-y-6">
        {/* Current password field */}
        <div>
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Current Password <span className="text-red-600">*</span>
          </label>
          <div className="mt-2">
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.currentPassword ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.currentPassword ? 'current-password-error' : undefined
              }
            />
          </div>
          {state?.errors?.currentPassword && (
            <p id="current-password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.currentPassword}
            </p>
          )}
        </div>

        {/* New password field */}
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            New Password <span className="text-red-600">*</span>
          </label>
          <div className="mt-2">
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.newPassword ? 'true' : 'false'}
              aria-describedby={state?.errors?.newPassword ? 'new-password-error' : 'new-password-help'}
            />
          </div>
          <p id="new-password-help" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Must be at least 8 characters with uppercase, lowercase, and a number
          </p>
          {state?.errors?.newPassword && (
            <p id="new-password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm password field */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Confirm New Password <span className="text-red-600">*</span>
          </label>
          <div className="mt-2">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.confirmPassword ? 'true' : 'false'}
              aria-describedby={state?.errors?.confirmPassword ? 'confirm-password-error' : undefined}
            />
          </div>
          {state?.errors?.confirmPassword && (
            <p id="confirm-password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit button */}
        <SubmitButton />
      </form>
    </div>
  )
}
