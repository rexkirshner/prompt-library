/**
 * Admin Backup Actions
 *
 * Server actions for exporting and importing prompts.
 * Provides backup and recovery functionality for administrators.
 */

'use server'

import { getAdminUser } from '@/lib/auth/admin'
import { ExportService } from '@/lib/import-export'
import type { ExportData } from '@/lib/import-export'

export interface ExportPromptsActionResult {
  success: boolean
  data?: ExportData
  count?: number
  error?: string
}

/**
 * Export all prompts to JSON format (admin only)
 *
 * Fetches all prompts from the database and exports them to a portable
 * JSON format suitable for backup and recovery. Includes all prompt data,
 * tags, and metadata, but excludes transient data like view counts and
 * database IDs.
 *
 * The exported data includes:
 * - All prompt content (title, text, description, example output)
 * - Classification data (category, tags)
 * - Attribution (author name and URL)
 * - Status information (status, featured flag)
 * - Timestamps (created, updated, approved)
 * - Audit trail (submitted by, approved by)
 *
 * @returns Result object with export data and statistics, or error message
 *
 * @security
 * - Requires admin authentication (checked via getAdminUser)
 * - Only exports non-deleted prompts (respects soft-delete)
 * - Returns descriptive error if admin check fails or export errors
 *
 * @example
 * ```typescript
 * // In an admin backup component (server action)
 * const result = await exportPromptsAction()
 *
 * if (result.success && result.data) {
 *   console.log(`Exported ${result.count} prompts`)
 *   console.log('Export version:', result.data.version)
 *   console.log('Exported at:', result.data.exported_at)
 *
 *   // Download as JSON file
 *   const json = JSON.stringify(result.data, null, 2)
 *   const blob = new Blob([json], { type: 'application/json' })
 *   const url = URL.createObjectURL(blob)
 *   const a = document.createElement('a')
 *   a.href = url
 *   a.download = `prompts-backup-${Date.now()}.json`
 *   a.click()
 * } else {
 *   console.error('Export failed:', result.error)
 *   // Example errors:
 *   // - "Unauthorized: Admin access required"
 *   // - "Failed to export prompts"
 *   // - Database connection errors
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Show export statistics
 * async function handleExport() {
 *   const result = await exportPromptsAction()
 *
 *   if (result.success) {
 *     showSuccessMessage(
 *       `Successfully exported ${result.count} prompts`
 *     )
 *     // Trigger download...
 *   } else {
 *     showErrorMessage(result.error || 'Export failed')
 *   }
 * }
 * ```
 */
export async function exportPromptsAction(): Promise<ExportPromptsActionResult> {
  try {
    // Check admin authorization
    const admin = await getAdminUser()
    if (!admin) {
      return {
        success: false,
        error: 'Unauthorized: Admin access required',
      }
    }

    // Create export service and export all prompts
    const exportService = new ExportService()
    const result = await exportService.exportAll()

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Failed to export prompts',
      }
    }

    return {
      success: true,
      data: result.data,
      count: result.count,
    }
  } catch (error) {
    console.error('Failed to export prompts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export prompts',
    }
  }
}
