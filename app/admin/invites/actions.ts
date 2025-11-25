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
 * Create a new invite code (admin only)
 */
export async function createInviteAction(): Promise<CreateInviteActionResult> {
  try {
    // Check admin authorization
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Get base URL from environment or construct from headers
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'

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
