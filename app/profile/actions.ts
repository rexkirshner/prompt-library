/**
 * Profile Actions
 *
 * Server actions for user profile management.
 */

'use server'

import { prisma } from '@/lib/db/client'
import { getCurrentUser } from '@/lib/auth'
import { hashPassword, verifyPassword } from '@/lib/auth/password'
import { validatePassword } from '@/lib/auth/validation'
import { passwordChangeRateLimiter } from '@/lib/utils/rate-limit'
import { logUserAction, USER_ACTIONS } from '@/lib/audit'

export interface ChangePasswordResult {
  success: boolean
  errors?: {
    currentPassword?: string
    newPassword?: string
    confirmPassword?: string
    form?: string
  }
  message?: string
}

/**
 * Change user password
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<ChangePasswordResult> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return { success: false, errors: { form: 'Not authenticated' } }
    }

    // Check rate limit to prevent brute force attacks
    if (!passwordChangeRateLimiter.checkLimit(user.id)) {
      const resetTime = passwordChangeRateLimiter.getTimeUntilReset(user.id)
      const minutes = Math.ceil(resetTime / 60000)
      return {
        success: false,
        errors: {
          form: `Too many password change attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
        },
      }
    }

    // Validate inputs
    const errors: ChangePasswordResult['errors'] = {}

    if (!currentPassword) {
      errors.currentPassword = 'Current password is required'
    }

    if (!newPassword) {
      errors.newPassword = 'New password is required'
    } else {
      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.valid) {
        errors.newPassword = passwordValidation.errors[0]
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password'
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errors).length > 0) {
      return { success: false, errors }
    }

    // Get user's current password hash from database
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser || !dbUser.password) {
      return { success: false, errors: { form: 'User not found' } }
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isCurrentPasswordValid) {
      // Record failed attempt to prevent brute force attacks
      passwordChangeRateLimiter.recordAttempt(user.id)
      return {
        success: false,
        errors: { currentPassword: 'Current password is incorrect' },
      }
    }

    // Check that new password is different from current password
    // Use hash comparison to avoid keeping plaintext password in memory
    const newPasswordMatchesCurrent = await verifyPassword(newPassword, dbUser.password)
    if (newPasswordMatchesCurrent) {
      return {
        success: false,
        errors: { newPassword: 'New password must be different from current password' },
      }
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword)

    // Update password in database
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    // Log successful password change for security audit trail
    // Non-blocking: Don't fail password change if logging fails
    await logUserAction(user.id, USER_ACTIONS.PASSWORD_CHANGED, {
      details: {
        method: 'self-service',
        timestamp: new Date().toISOString(),
      },
    }).catch((error) => {
      // Log error but don't propagate to user
      console.error('Failed to log password change audit:', error)
    })

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Failed to change password:', error)
    return { success: false, errors: { form: 'Failed to change password' } }
  }
}
