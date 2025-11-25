/**
 * Admin Invite Actions
 *
 * Server actions for creating and managing invite codes.
 */

'use server'

import { getAdminUser } from '@/lib/auth/admin'
import { createInviteCode } from '@/lib/invites'

export interface CreateInviteActionResult {
  success: boolean
  inviteUrl?: string
  inviteCode?: string
  error?: string
}

/**
 * Create a new invite code for user registration (admin only)
 *
 * Generates a unique invite code and URL that can be shared with new users
 * to register for the application. Only administrators can create invite codes.
 * The invite code is one-time use and expires after being redeemed.
 *
 * @returns Result object with invite URL and code, or error message
 *
 * @security
 * - Requires admin authentication (checked via getAdminUser)
 * - Validates NEXTAUTH_URL is configured to prevent broken invite links
 * - Returns descriptive error if admin check fails or URL misconfigured
 *
 * @example
 * ```typescript
 * // In an admin dashboard component (server action)
 * const result = await createInviteAction()
 *
 * if (result.success) {
 *   console.log('Invite URL:', result.inviteUrl)
 *   console.log('Invite Code:', result.inviteCode)
 *   // Example: https://app.example.com/auth/signup?invite=abc123def456
 * } else {
 *   console.error('Error:', result.error)
 *   // Example errors:
 *   // - "Unauthorized: Admin access required"
 *   // - "Server configuration error: Base URL not configured"
 *   // - "Failed to create invite code"
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Copy invite URL to clipboard
 * async function handleGenerateInvite() {
 *   const result = await createInviteAction()
 *   if (result.success && result.inviteUrl) {
 *     await navigator.clipboard.writeText(result.inviteUrl)
 *     showSuccessMessage('Invite link copied!')
 *   }
 * }
 * ```
 */
export async function createInviteAction(): Promise<CreateInviteActionResult> {
  try {
    // Check admin authorization
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Get base URL from environment variable
    // Fail fast if NEXTAUTH_URL is not configured to prevent broken invite links
    const baseUrl = process.env.NEXTAUTH_URL
    if (!baseUrl) {
      console.error('NEXTAUTH_URL environment variable is not set')
      return {
        success: false,
        error: 'Server configuration error: Base URL not configured',
      }
    }

    // Create invite code
    const result = await createInviteCode(admin.id, baseUrl)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      inviteUrl: result.inviteUrl,
      inviteCode: result.inviteCode,
    }
  } catch (error) {
    console.error('Failed to create invite:', error)
    return { success: false, error: 'Failed to create invite code' }
  }
}
