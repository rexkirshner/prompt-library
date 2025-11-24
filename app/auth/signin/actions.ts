/**
 * Sign-in Server Actions
 *
 * Server-side actions for user authentication using NextAuth.
 * Handles sign-in with credentials provider.
 */

'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import {
  validateSignInForm,
  type SignInFormData,
} from '@/lib/auth/validation'

export interface SignInResult {
  success: boolean
  errors?: Record<string, string>
  message?: string
}

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
): Promise<SignInResult> {
  // Validate form data
  const validation = validateSignInForm(formData)
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    }
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
    return {
      success: true,
    }
  } catch (error) {
    // NextAuth throws errors for authentication failures
    if (error instanceof AuthError) {
      // Handle different auth error types
      switch (error.type) {
        case 'CredentialsSignin':
          return {
            success: false,
            errors: {
              form: 'Invalid email or password. Please try again.',
            },
          }
        case 'CallbackRouteError':
          return {
            success: false,
            errors: {
              form: 'Authentication error. Please try again.',
            },
          }
        default:
          return {
            success: false,
            errors: {
              form: 'An unexpected error occurred. Please try again.',
            },
          }
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
): Promise<SignInResult> {
  const data: SignInFormData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const redirectTo = (formData.get('redirectTo') as string) || '/prompts'

  return await signInUser(data, redirectTo)
}
