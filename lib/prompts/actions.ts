/**
 * Prompt Actions
 *
 * Server actions for prompt-related operations.
 */

'use server'

import { prisma } from '@/lib/db/client'

/**
 * Increment copy count for a prompt
 *
 * @param promptId - UUID of the prompt
 */
export async function incrementCopyCount(promptId: string): Promise<void> {
  try {
    await prisma.prompts.update({
      where: { id: promptId },
      data: {
        copy_count: {
          increment: 1,
        },
      },
    })
  } catch (error) {
    // Log error but don't throw - copy tracking should not block user interaction
    console.error('Failed to increment copy count:', error)
  }
}
