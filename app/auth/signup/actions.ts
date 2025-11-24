/**
 * Sign-up Server Actions
 *
 * Server-side actions for user registration.
 * Handles validation, password hashing, and user creation.
 */

'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth'
import {
  validateSignUpForm,
  type SignUpFormData,
} from '@/lib/auth/validation'

export interface SignUpResult {
  success: boolean
  errors?: Record<string, string>
  message?: string
}

/**
 * Create a new user account
 *
 * @param formData - Sign-up form data
 * @returns Result with success status and any errors
 */
export async function signUpUser(
  formData: SignUpFormData,
): Promise<SignUpResult> {
  // Validate form data
  const validation = validateSignUpForm(formData)
  if (!validation.success) {
    return {
      success: false,
      errors: validation.errors,
    }
  }

  const { name, email, password } = formData

  try {
    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.trim().toLowerCase() },
    })

    if (existingUser) {
      return {
        success: false,
        errors: {
          email: 'An account with this email already exists',
        },
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        name: name.trim(),
        is_admin: false,
        // created_at uses database default (@default(now()))
      },
    })

    return {
      success: true,
      message: 'Account created successfully! Please sign in.',
    }
  } catch (error) {
    console.error('Sign-up error:', error)
    return {
      success: false,
      errors: {
        form: 'An unexpected error occurred. Please try again.',
      },
    }
  }
}

/**
 * Server action for form submission
 * Redirects to sign-in on success
 */
export async function handleSignUp(prevState: unknown, formData: FormData) {
  const data: SignUpFormData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = await signUpUser(data)

  if (result.success) {
    // Redirect to sign-in page on success
    redirect('/auth/signin?registered=true')
  }

  return result
}
