/**
 * Admin Backup Actions
 *
 * Server actions for exporting and importing prompts.
 * Provides backup and recovery functionality for administrators.
 */

'use server'

import { getAdminUser } from '@/lib/auth/admin'
import { ExportService, ImportService } from '@/lib/import-export'
import type { ExportData, ImportResult } from '@/lib/import-export'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'admin/backup/actions' })

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
    logger.error(
      'Failed to export prompts',
      error as Error
    )
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export prompts',
    }
  }
}

export interface ImportPromptsActionOptions {
  onDuplicate?: 'skip' | 'update' | 'error'
  validateOnly?: boolean
  dryRun?: boolean
}

/**
 * Validate import data without importing (admin only)
 *
 * Performs comprehensive validation of import data including JSON structure,
 * schema validation, business logic checks, and duplicate detection. Returns
 * detailed statistics about what would be imported without making any
 * database changes.
 *
 * This is useful for:
 * - Previewing import results before committing
 * - Checking for errors and warnings
 * - Verifying duplicate handling behavior
 * - Confirming data integrity
 *
 * @param jsonData - JSON string containing export data to validate
 * @param options - Validation options (onDuplicate strategy)
 * @returns Result object with validation details and statistics
 *
 * @security
 * - Requires admin authentication (checked via getAdminUser)
 * - Only validates, does not modify database
 * - Returns descriptive error if admin check fails
 *
 * @example
 * ```typescript
 * // In an admin import component (server action)
 * const result = await validateImportAction(jsonData, { onDuplicate: 'skip' })
 *
 * if (result.success) {
 *   console.log(`Would import ${result.imported} prompts`)
 *   console.log(`Would skip ${result.skipped} duplicates`)
 *   console.log(`Found ${result.failed} errors`)
 *
 *   // Show warnings
 *   result.warnings?.forEach(warning => {
 *     console.warn(warning)
 *   })
 *
 *   // Show errors
 *   result.errors?.forEach(error => {
 *     console.error(`Prompt ${error.index}: ${error.message}`)
 *   })
 * } else {
 *   console.error('Validation failed:', result.error)
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Check different duplicate strategies
 * async function previewImport(jsonData: string) {
 *   // Preview with skip strategy
 *   const skipResult = await validateImportAction(jsonData, {
 *     onDuplicate: 'skip'
 *   })
 *   console.log(`Skip: ${skipResult.imported} new, ${skipResult.skipped} skipped`)
 *
 *   // Preview with update strategy
 *   const updateResult = await validateImportAction(jsonData, {
 *     onDuplicate: 'update'
 *   })
 *   console.log(`Update: ${updateResult.imported} imported/updated`)
 * }
 * ```
 */
export async function validateImportAction(
  jsonData: string,
  options?: ImportPromptsActionOptions
): Promise<ImportResult> {
  try {
    // Check admin authorization
    const admin = await getAdminUser()
    if (!admin) {
      return {
        success: false,
        total: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [{ index: -1, message: 'Unauthorized: Admin access required' }],
        warnings: [],
      }
    }

    // Create import service and validate
    const importService = new ImportService()
    const result = await importService.importAll(jsonData, {
      ...options,
      validateOnly: true, // Only validate, don't import
    })

    return result
  } catch (error) {
    logger.error(
      'Failed to validate import data',
      error as Error
    )
    return {
      success: false,
      total: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [
        {
          index: -1,
          message: error instanceof Error ? error.message : 'Failed to validate import data',
        },
      ],
      warnings: [],
    }
  }
}

/**
 * Import prompts from JSON format (admin only)
 *
 * Imports validated prompts into the database with full transaction support.
 * Handles duplicate detection, tag creation, and maintains data integrity
 * through atomic operations. All changes are rolled back if any error occurs.
 *
 * The import process includes:
 * - JSON structure and schema validation
 * - Business logic validation
 * - XSS sanitization of all text fields
 * - Duplicate detection and handling
 * - Automatic tag creation (get-or-create)
 * - Atomic database transaction with rollback
 * - Detailed error and warning reporting
 *
 * **Duplicate Handling Strategies:**
 * - 'skip' (default): Skip duplicates, keep existing (safest)
 * - 'update': Update existing prompts with new data
 * - 'error': Fail if any duplicates found (aborts entire import)
 *
 * @param jsonData - JSON string containing export data to import
 * @param options - Import options including duplicate handling strategy
 * @returns Result object with import statistics and details
 *
 * @security
 * - Requires admin authentication (checked via getAdminUser)
 * - Sanitizes all text fields to prevent XSS attacks
 * - Uses database transaction for atomicity
 * - Validates data before import
 * - Records admin user ID for audit trail
 *
 * @example
 * ```typescript
 * // In an admin import component (server action)
 * const result = await importPromptsAction(jsonData, {
 *   onDuplicate: 'skip'
 * })
 *
 * if (result.success) {
 *   console.log(`Successfully imported ${result.imported} prompts`)
 *   console.log(`Skipped ${result.skipped} duplicates`)
 *
 *   // Show any warnings
 *   if (result.warnings.length > 0) {
 *     console.warn('Import warnings:')
 *     result.warnings.forEach(warning => {
 *       console.warn(`- ${warning.message} (${warning.slug})`)
 *     })
 *   }
 * } else {
 *   console.error('Import failed:', result.errors)
 *   // Example errors:
 *   // - "Unauthorized: Admin access required"
 *   // - "Invalid JSON structure"
 *   // - "Duplicate slug found and onDuplicate is error"
 *   // - Transaction rollback errors
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Import with update strategy
 * async function handleImportWithUpdate(jsonData: string) {
 *   const result = await importPromptsAction(jsonData, {
 *     onDuplicate: 'update'
 *   })
 *
 *   if (result.success) {
 *     showSuccessMessage(
 *       `Imported/updated ${result.imported} prompts successfully`
 *     )
 *
 *     // Check for updated prompts
 *     const updated = result.warnings.filter(w =>
 *       w.message.includes('Updated existing')
 *     )
 *     if (updated.length > 0) {
 *       console.log(`Updated ${updated.length} existing prompts`)
 *     }
 *   } else {
 *     showErrorMessage(`Failed to import: ${result.errors[0].message}`)
 *   }
 * }
 * ```
 */
export async function importPromptsAction(
  jsonData: string,
  options?: ImportPromptsActionOptions
): Promise<ImportResult> {
  try {
    // Check admin authorization
    const admin = await getAdminUser()
    if (!admin) {
      return {
        success: false,
        total: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: [{ index: -1, message: 'Unauthorized: Admin access required' }],
        warnings: [],
      }
    }

    // Create import service and perform import
    const importService = new ImportService()
    const result = await importService.importAll(
      jsonData,
      {
        onDuplicate: options?.onDuplicate || 'skip',
        dryRun: options?.dryRun || false,
      },
      admin.id // Pass admin user ID for audit trail
    )

    return result
  } catch (error) {
    logger.error(
      'Failed to import prompts',
      error as Error,
      { onDuplicate: options?.onDuplicate }
    )
    return {
      success: false,
      total: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      errors: [
        {
          index: -1,
          message: error instanceof Error ? error.message : 'Failed to import prompts',
        },
      ],
      warnings: [],
    }
  }
}
