/**
 * Admin Moderation Actions
 *
 * Server actions for approving and rejecting prompt submissions.
 */

'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db/client'
import { getAdminUser } from '@/lib/auth/admin'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'admin/queue/actions' })

export interface ModerationResult {
  success: boolean
  error?: string
}

/**
 * Approve a pending prompt
 */
export async function approvePrompt(promptId: string): Promise<ModerationResult> {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Update prompt status
    await prisma.prompts.update({
      where: { id: promptId },
      data: {
        status: 'APPROVED',
        approved_at: new Date(),
        approved_by_user_id: admin.id,
      },
    })

    // Revalidate relevant pages
    revalidatePath('/admin/queue')
    revalidatePath('/prompts')

    return { success: true }
  } catch (error) {
    logger.error(
      'Failed to approve prompt',
      error as Error,
      { promptId }
    )
    return { success: false, error: 'Failed to approve prompt' }
  }
}

/**
 * Reject a pending prompt with optional reason
 */
export async function rejectPrompt(
  promptId: string,
  rejectionReason?: string,
): Promise<ModerationResult> {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Update prompt status
    await prisma.prompts.update({
      where: { id: promptId },
      data: {
        status: 'REJECTED',
        rejection_reason: rejectionReason?.trim() || null,
      },
    })

    // Revalidate queue page
    revalidatePath('/admin/queue')

    return { success: true }
  } catch (error) {
    logger.error(
      'Failed to reject prompt',
      error as Error,
      { promptId, rejectionReason }
    )
    return { success: false, error: 'Failed to reject prompt' }
  }
}

/**
 * Soft delete an approved prompt
 */
export async function deletePrompt(promptId: string): Promise<ModerationResult> {
  try {
    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, error: 'Unauthorized: Admin access required' }
    }

    // Soft delete by setting deleted_at
    await prisma.prompts.update({
      where: { id: promptId },
      data: {
        deleted_at: new Date(),
      },
    })

    // Revalidate relevant pages
    revalidatePath('/admin')
    revalidatePath('/prompts')

    return { success: true }
  } catch (error) {
    logger.error(
      'Failed to delete prompt',
      error as Error,
      { promptId }
    )
    return { success: false, error: 'Failed to delete prompt' }
  }
}
