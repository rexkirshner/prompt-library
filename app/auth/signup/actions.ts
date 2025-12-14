/**
 * Sign-up Server Actions
 *
 * Server-side actions for user registration.
 * Handles validation, password hashing, invite code validation, and user creation.
 */

'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { hashPassword } from '@/lib/auth'
import {
  validateSignUpForm,
  type SignUpFormData,
} from '@/lib/auth/validation'
import { validateInviteCode } from '@/lib/invites'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'auth/signup/actions' })

export interface SignUpResult {
  success: boolean
  errors?: Record<string, string>
  message?: string
}

/**
 * Create a new user account
 *
 * @param formData - Sign-up form data
 * @param inviteCode - Required invite code for registration
 * @returns Result with success status and any errors
 */
export async function signUpUser(
  formData: SignUpFormData,
  inviteCode: string,
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
    // Validate invite code
    const inviteValidation = await validateInviteCode(inviteCode)
    if (!inviteValidation.valid) {
      return {
        success: false,
        errors: {
          form: `Invalid invite code: ${inviteValidation.error}`,
        },
      }
    }

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

    // Get invite creator for invited_by field
    const invite = await prisma.invite_codes.findUnique({
      where: { code: inviteCode },
      select: { created_by: true },
    })

    if (!invite) {
      return {
        success: false,
        errors: {
          form: 'Invite code not found',
        },
      }
    }

    // Create user and redeem invite in a transaction
    const _newUser = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.users.create({
        data: {
          id: crypto.randomUUID(),
          email: email.trim().toLowerCase(),
          password: hashedPassword,
          name: name.trim(),
          is_admin: false,
          invited_by: invite.created_by, // Track who invited this user
          // created_at uses database default (@default(now()))
        },
      })

      // Mark invite as used
      await tx.invite_codes.update({
        where: { code: inviteCode },
        data: {
          used_by: user.id,
          used_at: new Date(),
        },
      })

      return user
    })

    return {
      success: true,
      message: 'Account created successfully! Please sign in.',
    }
  } catch (error) {
    logger.error(
      'Sign-up error',
      error as Error
    )
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
  const inviteCode = formData.get('inviteCode') as string

  // Require invite code
  if (!inviteCode) {
    return {
      success: false,
      errors: {
        form: 'Invite code is required to sign up',
      },
    }
  }

  const data: SignUpFormData = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  }

  const result = await signUpUser(data, inviteCode)

  if (result.success) {
    // Redirect to sign-in page on success
    redirect('/auth/signin?registered=true')
  }

  return result
}
