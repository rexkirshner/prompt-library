/**
 * API endpoint for soft deleting and restoring prompts
 *
 * POST /api/admin/prompts/:id/delete - Soft delete a prompt
 * - Sets deleted_at timestamp
 * - Logs the deletion action
 * - Requires admin authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { logUserAction } from '@/lib/audit'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'api:admin:prompts:delete' })

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

/**
 * POST /api/admin/prompts/:id/delete
 * Soft delete a prompt by setting deleted_at timestamp
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || !session.user.isAdmin) {
      logger.warn('Unauthorized delete attempt', { userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const action = body.action || 'delete' // 'delete' or 'restore'

    // Fetch the prompt
    const prompt = await prisma.prompts.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        deleted_at: true,
      },
    })

    if (!prompt) {
      logger.warn('Prompt not found for deletion', { promptId: id })
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    if (action === 'delete') {
      // Soft delete: set deleted_at timestamp
      if (prompt.deleted_at) {
        return NextResponse.json(
          { error: 'Prompt is already deleted' },
          { status: 400 }
        )
      }

      const updated = await prisma.prompts.update({
        where: { id },
        data: {
          deleted_at: new Date(),
        },
      })

      // Log the deletion
      await logUserAction(session.user.id, 'PROMPT_DELETED', {
        details: {
          entityType: 'prompt',
          entityId: id,
          title: prompt.title,
          slug: prompt.slug,
        },
      })

      logger.info('Prompt soft deleted', {
        promptId: id,
        title: prompt.title,
        deletedBy: session.user.id,
      })

      return NextResponse.json({
        success: true,
        message: 'Prompt deleted successfully',
        deleted_at: updated.deleted_at,
      })
    } else if (action === 'restore') {
      // Restore: clear deleted_at timestamp
      if (!prompt.deleted_at) {
        return NextResponse.json(
          { error: 'Prompt is not deleted' },
          { status: 400 }
        )
      }

      await prisma.prompts.update({
        where: { id },
        data: {
          deleted_at: null,
        },
      })

      // Log the restoration
      await logUserAction(session.user.id, 'PROMPT_RESTORED', {
        details: {
          entityType: 'prompt',
          entityId: id,
          title: prompt.title,
          slug: prompt.slug,
        },
      })

      logger.info('Prompt restored', {
        promptId: id,
        title: prompt.title,
        restoredBy: session.user.id,
      })

      return NextResponse.json({
        success: true,
        message: 'Prompt restored successfully',
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Error in delete endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
