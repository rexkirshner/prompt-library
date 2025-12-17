/**
 * Bulk Import API Endpoint
 *
 * POST /api/admin/bulk-import - Import multiple prompts at once
 *
 * Requires admin authentication. Accepts JSON payload with prompts array.
 * Validates input, processes import, and returns detailed results.
 *
 * @module app/api/admin/bulk-import
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { logUserAction } from '@/lib/audit'
import { logger as baseLogger } from '@/lib/logging'
import {
  parseAndValidateBulkImport,
  processBulkImport,
} from '@/lib/admin/bulk-import'

const logger = baseLogger.child({ module: 'api:admin:bulk-import' })

/**
 * POST /api/admin/bulk-import
 *
 * Import multiple prompts from JSON data.
 *
 * Request body should be JSON with structure:
 * {
 *   "prompts": [
 *     {
 *       "title": "Prompt Title",
 *       "prompt_text": "The prompt content",
 *       "category": "Development",
 *       "tags": ["optional", "tags"],
 *       "description": "Optional description",
 *       "author_name": "Optional author (defaults to Input Atlas AI)",
 *       "ai_generated": true,
 *       "featured": false,
 *       "slug": "optional-custom-slug"
 *     }
 *   ]
 * }
 *
 * Required fields per prompt: title, prompt_text, category
 * All other fields are optional with sensible defaults.
 *
 * @example Response on success:
 * {
 *   "success": true,
 *   "total": 10,
 *   "created": 8,
 *   "skipped": 2,
 *   "failed": 0,
 *   "message": "Processed 10 prompts: 8 prompts created, 2 skipped (duplicates)",
 *   "results": [
 *     { "title": "...", "slug": "...", "success": true, "id": "..." },
 *     { "title": "...", "slug": "...", "success": true, "skipped": true, "error": "..." }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await auth()
    if (!session?.user || !session.user.isAdmin) {
      logger.warn('Unauthorized bulk import attempt', { userId: session?.user?.id })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUserId = session.user.id

    // Parse request body
    let body: string
    try {
      body = await request.text()
    } catch {
      return NextResponse.json(
        { error: 'Failed to read request body' },
        { status: 400 }
      )
    }

    if (!body || body.trim().length === 0) {
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      )
    }

    // Validate the JSON payload
    const validation = parseAndValidateBulkImport(body)
    if (!validation.valid || !validation.data) {
      logger.info('Bulk import validation failed', {
        adminUserId,
        errorCount: validation.errors.length,
        errors: validation.errors.slice(0, 5), // Log first 5 errors
      })

      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    logger.info('Starting bulk import', {
      adminUserId,
      promptCount: validation.data.prompts.length,
    })

    // Process the import
    const result = await processBulkImport(validation.data, adminUserId)

    // Log the action
    await logUserAction(adminUserId, 'BULK_IMPORT', {
      details: {
        total: result.total,
        created: result.created,
        skipped: result.skipped,
        failed: result.failed,
        success: result.success,
      },
    })

    logger.info('Bulk import completed', {
      adminUserId,
      total: result.total,
      created: result.created,
      skipped: result.skipped,
      failed: result.failed,
      success: result.success,
    })

    // Return result
    return NextResponse.json({
      success: result.success,
      total: result.total,
      created: result.created,
      skipped: result.skipped,
      failed: result.failed,
      message: result.message,
      results: result.results,
    })
  } catch (error) {
    logger.error('Error in bulk import endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
