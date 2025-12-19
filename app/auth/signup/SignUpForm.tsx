/**
 * Sign-Up Form Component
 *
 * Client component for user registration with progressive enhancement.
 * Uses React's useActionState and useFormStatus for optimistic updates.
 */

'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { handleSignUp } from './actions'
import { type FormActionResult, isFormError, isSuccess } from '@/lib/actions'

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
      {pending ? 'Creating account...' : 'Sign up'}
    </button>
  )
}

/**
 * Sign-up form with validation and error handling
 */
export function SignUpForm({ inviteCode }: { inviteCode: string }) {
  const [state, formAction] = useActionState<FormActionResult | null, FormData>(
    handleSignUp,
    null,
  )

  // Extract errors and success message with type narrowing
  const errors = state && isFormError(state) ? state.errors : null
  const successMessage = state && isSuccess(state) ? state.message : null

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden invite code field */}
      <input type="hidden" name="inviteCode" value={inviteCode} />
      {/* Form-level error */}
      {errors?.form && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{errors.form}</p>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      {/* Name field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
        >
          Name
        </label>
        <div className="mt-2">
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={errors?.name ? 'true' : 'false'}
            aria-describedby={errors?.name ? 'name-error' : undefined}
          />
        </div>
        {errors?.name && (
          <p id="name-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.name}
          </p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
        >
          Email address
        </label>
        <div className="mt-2">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={errors?.email ? 'true' : 'false'}
            aria-describedby={errors?.email ? 'email-error' : undefined}
          />
        </div>
        {errors?.email && (
          <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
        >
          Password
        </label>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={errors?.password ? 'true' : 'false'}
            aria-describedby={errors?.password ? 'password-error' : 'password-help'}
          />
        </div>
        <p id="password-help" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Minimum 8 characters with uppercase, lowercase, and number
        </p>
        {errors?.password && (
          <p id="password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      {/* Confirm password field */}
      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
        >
          Confirm password
        </label>
        <div className="mt-2">
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={errors?.confirmPassword ? 'true' : 'false'}
            aria-describedby={errors?.confirmPassword ? 'confirm-password-error' : undefined}
          />
        </div>
        {errors?.confirmPassword && (
          <p id="confirm-password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      {/* Submit button */}
      <SubmitButton />
    </form>
  )
}
