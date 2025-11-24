/**
 * Sign-In Form Component
 *
 * Client component for user authentication with progressive enhancement.
 * Uses React's useFormState and useFormStatus for optimistic updates.
 */

'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { handleSignIn, type SignInResult } from './actions'

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
  const [state, formAction] = useFormState<SignInResult | null, FormData>(
    handleSignIn,
    null,
  )

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden redirect field */}
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}

      {/* Form-level error */}
      {state?.errors?.form && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.errors.form}</p>
        </div>
      )}

      {/* Email field */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium leading-6 text-gray-900"
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
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.email ? 'true' : 'false'}
            aria-describedby={state?.errors?.email ? 'email-error' : undefined}
          />
        </div>
        {state?.errors?.email && (
          <p id="email-error" className="mt-2 text-sm text-red-600">
            {state.errors.email}
          </p>
        )}
      </div>

      {/* Password field */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium leading-6 text-gray-900"
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
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.password ? 'true' : 'false'}
            aria-describedby={
              state?.errors?.password ? 'password-error' : undefined
            }
          />
        </div>
        {state?.errors?.password && (
          <p id="password-error" className="mt-2 text-sm text-red-600">
            {state.errors.password}
          </p>
        )}
      </div>

      {/* Submit button */}
      <SubmitButton />
    </form>
  )
}
