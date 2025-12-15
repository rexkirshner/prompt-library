/**
 * Sign-in Server Actions
 *
 * Server-side actions for user authentication using NextAuth.
 * Handles sign-in with credentials provider.
 *
 * @security Rate limited to 5 attempts per 15 minutes per IP address
 */

'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import {
  validateSignInForm,
  type SignInFormData,
} from '@/lib/auth/validation'
import {
  checkSignInRateLimit,
  recordSignInAttempt,
  formatRetryTime,
} from '@/lib/auth/rate-limit'
import { type FormActionResult, success, formError } from '@/lib/actions'

/**
 * @deprecated Use FormActionResult from @/lib/actions instead
 */
export type SignInResult = FormActionResult

/**
 * Sign in user with email and password
 *
 * @param formData - Sign-in form data
 * @param redirectTo - Optional redirect URL after successful sign-in
 * @returns Result with success status and any errors
 */
export async function signInUser(
  formData: SignInFormData,
  redirectTo: string = '/prompts',
): Promise<FormActionResult> {
  // Check rate limit before processing
  const rateLimit = await checkSignInRateLimit()
  if (!rateLimit.allowed) {
    return formError({
      form: `Too many sign-in attempts. Please try again in ${formatRetryTime(rateLimit.retryAfterSeconds)}.`,
    })
  }

  // Record this attempt before validation
  await recordSignInAttempt()

  // Validate form data
  const validation = validateSignInForm(formData)
  if (!validation.success) {
    return formError(validation.errors)
  }

  const { email, password } = formData

  try {
    // Attempt to sign in using NextAuth
    await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: true,
      redirectTo,
    })

    // If signIn doesn't throw, it redirects, so we won't reach here
    return success()
  } catch (error) {
    // NextAuth throws errors for authentication failures
    if (error instanceof AuthError) {
      // Handle different auth error types
      switch (error.type) {
        case 'CredentialsSignin':
          return formError({
            form: 'Invalid email or password. Please try again.',
          })
        case 'CallbackRouteError':
          return formError({
            form: 'Authentication error. Please try again.',
          })
        default:
          return formError({
            form: 'An unexpected error occurred. Please try again.',
          })
      }
    }

    // Re-throw if it's a redirect (NextAuth uses NEXT_REDIRECT for successful auth)
    throw error
  }
}

/**
 * Server action for form submission
 */
export async function handleSignIn(
  prevState: unknown,
  formData: FormData,
): Promise<FormActionResult> {
  const data: SignInFormData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const redirectTo = (formData.get('redirectTo') as string) || '/prompts'

  return await signInUser(data, redirectTo)
}
