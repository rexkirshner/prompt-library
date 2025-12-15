/**
 * Sign-In Form Component
 *
 * Client component for user authentication with progressive enhancement.
 * Uses React's useActionState and useFormStatus for optimistic updates.
 */

'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { handleSignIn } from './actions'
import { type FormActionResult, isFormError } from '@/lib/actions'

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Signing in...' : 'Sign in'}
    </button>
  )
}

interface SignInFormProps {
  redirectTo?: string
}

/**
 * Sign-in form with validation and error handling
 */
export function SignInForm({ redirectTo }: SignInFormProps) {
  const [state, formAction] = useActionState<FormActionResult | null, FormData>(
    handleSignIn,
    null,
  )

  // Extract errors with type narrowing
  const errors = state && isFormError(state) ? state.errors : null

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden redirect field */}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {/* Form-level error */}
      {errors?.form && (
        <div className="rounded-md bg-red-50 dark:bg-red-900 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{errors.form}</p>
        </div>
      )}

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
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6"
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
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Password
          </label>
          {/* TODO: Add forgot password link in Phase 2+ */}
          {/* <div className="text-sm">
            <a
              href="/auth/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </a>
          </div> */}
        </div>
        <div className="mt-2">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:focus:ring-blue-500 sm:text-sm sm:leading-6"
            aria-invalid={errors?.password ? 'true' : 'false'}
            aria-describedby={errors?.password ? 'password-error' : undefined}
          />
        </div>
        {errors?.password && (
          <p id="password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
            {errors.password}
          </p>
        )}
      </div>

      {/* Submit button */}
      <SubmitButton />
    </form>
  )
}
