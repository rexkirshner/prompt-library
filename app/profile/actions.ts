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

    if (!dbUser) {
      return { success: false, errors: { form: 'User not found' } }
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        errors: { currentPassword: 'Current password is incorrect' },
      }
    }

    // Check that new password is different from current
    if (currentPassword === newPassword) {
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

    return {
      success: true,
      message: 'Password changed successfully',
    }
  } catch (error) {
    console.error('Failed to change password:', error)
    return { success: false, errors: { form: 'Failed to change password' } }
  }
}
