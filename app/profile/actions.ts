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
import { logger as baseLogger } from '@/lib/logging'
import { type FormActionResult, success, formError } from '@/lib/actions'

const logger = baseLogger.child({ module: 'profile/actions' })

/**
 * @deprecated Use FormActionResult from @/lib/actions instead
 */
export type ChangePasswordResult = FormActionResult

/**
 * Change user password with validation and rate limiting
 *
 * Securely updates the authenticated user's password with comprehensive
 * validation, rate limiting, and audit logging. Enforces password policy
 * and prevents reuse of current password.
 *
 * @param currentPassword - The user's current password for verification
 * @param newPassword - The new password to set (must meet password policy)
 * @param confirmPassword - Confirmation of new password (must match newPassword)
 * @returns Result object indicating success/failure with error details
 *
 * @security
 * - Rate limited to 5 attempts per hour per user to prevent brute force
 * - Uses bcrypt for password hashing and comparison
 * - Validates current password before allowing change
 * - Prevents reusing current password as new password
 * - Logs successful password changes to audit trail
 *
 * @example
 * ```typescript
 * // In a server action or API route
 * const result = await changePassword(
 *   'currentPass123',
 *   'NewSecurePass456!',
 *   'NewSecurePass456!'
 * )
 *
 * if (result.success) {
 *   console.log(result.message) // "Password changed successfully"
 * } else {
 *   console.error(result.errors) // { newPassword: "Password too weak" }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handling rate limiting
 * const result = await changePassword('old', 'new', 'new')
 * if (result.errors?.form?.includes('Too many')) {
 *   // User has exceeded rate limit
 *   showRateLimitMessage(result.errors.form)
 * }
 * ```
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<FormActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user) {
      return formError({ form: 'Not authenticated' })
    }

    // Check rate limit to prevent brute force attacks
    if (!passwordChangeRateLimiter.checkLimit(user.id)) {
      const resetTime = passwordChangeRateLimiter.getTimeUntilReset(user.id)
      const minutes = Math.ceil(resetTime / 60000)
      return formError({
        form: `Too many password change attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      })
    }

    // Validate inputs
    const errors: Record<string, string> = {}

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
      return formError(errors)
    }

    // Get user's current password hash from database
    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
      select: { password: true },
    })

    if (!dbUser || !dbUser.password) {
      return formError({ form: 'User not found' })
    }

    // Verify current password
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.password)
    if (!isCurrentPasswordValid) {
      // Record failed attempt to prevent brute force attacks
      passwordChangeRateLimiter.recordAttempt(user.id)
      return formError({ currentPassword: 'Current password is incorrect' })
    }

    // Check that new password is different from current password
    // Use hash comparison to avoid keeping plaintext password in memory
    const newPasswordMatchesCurrent = await verifyPassword(newPassword, dbUser.password)
    if (newPasswordMatchesCurrent) {
      return formError({ newPassword: 'New password must be different from current password' })
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
      logger.error('Failed to log password change audit', error as Error, { userId: user.id })
    })

    return success(undefined, 'Password changed successfully')
  } catch (error) {
    logger.error('Failed to change password', error as Error)
    return formError({ form: 'Failed to change password' })
  }
}
