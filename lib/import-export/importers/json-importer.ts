/**
 * JSON Importer
 *
 * Imports prompts from JSON format following the ExportData schema.
 * Handles validation, duplicate detection, and database import.
 */

import type {
  IImporter,
  ImportFormat,
  ImportResult,
  ImportOptions,
  ValidationResult,
  PromptData,
  ExportData,
  ImportError,
} from '../types'
import { parseAndValidateJSON } from '../validators/json-validator'
import {
  batchValidatePrompts,
  sanitizePromptData,
  checkDuplicateSlug,
} from '../validators/prompt-validator'

/**
 * JSON format importer
 *
 * Validates and processes JSON import files. Performs comprehensive
 * validation before import and provides detailed results.
 *
 * **Import Flow:**
 * 1. Parse and validate JSON structure
 * 2. Validate individual prompts (business logic)
 * 3. Check for duplicates
 * 4. Sanitize data
 * 5. Return validated data and statistics
 *
 * Note: Actual database import is handled by ImportService for
 * transaction management. This importer focuses on validation and
 * data preparation.
 *
 * @example
 * ```typescript
 * const importer = new JSONImporter()
 *
 * // Validate only
 * const validation = await importer.validate(jsonString)
 * if (!validation.valid) {
 *   console.error('Validation errors:', validation.errors)
 * }
 *
 * // Prepare for import
 * const result = await importer.import(jsonString, {
 *   onDuplicate: 'skip',
 *   validateOnly: true
 * })
 * console.log(`Ready to import ${result.total} prompts`)
 * console.log(`Duplicates: ${result.skipped}, Errors: ${result.failed}`)
 * ```
 */
export class JSONImporter implements IImporter {
  /**
   * Validate import data without importing
   *
   * Performs comprehensive validation:
   * - JSON structure validation
   * - Schema validation
   * - Business logic validation
   * - Duplicate detection
   *
   * @param data - Raw JSON string to validate
   * @returns Validation result with detailed errors
   */
  async validate(data: string): Promise<ValidationResult> {
    // Step 1: Parse and validate JSON structure
    const parseResult = parseAndValidateJSON(data)

    if (!parseResult.valid) {
      return {
        valid: false,
        errors: parseResult.errors,
      }
    }

    const exportData = parseResult.data as ExportData

    // Step 2: Validate individual prompts (business logic)
    const { errors, warnings } = await batchValidatePrompts(exportData.prompts)

    // If there are blocking errors, validation fails
    if (errors.length > 0) {
      const errorMessages = errors.map(
        (err) => `Prompt ${err.index} (${err.slug}): ${err.message}`
      )

      return {
        valid: false,
        errors: errorMessages,
        warnings: warnings.map((w) => `Prompt ${w.index} (${w.slug}): ${w.message}`),
      }
    }

    // Validation passed (warnings are non-blocking)
    return {
      valid: true,
      errors: [],
      warnings: warnings.map((w) => `Prompt ${w.index} (${w.slug}): ${w.message}`),
    }
  }

  /**
   * Import prompts from JSON data
   *
   * Validates data and prepares import result with statistics.
   * If validateOnly is true, performs dry-run without actual import.
   *
   * **Duplicate Handling:**
   * - 'skip': Skip duplicates (default, safest)
   * - 'update': Update existing prompts
   * - 'error': Fail on duplicates
   *
   * @param data - JSON string to import
   * @param options - Import options
   * @returns Import result with statistics and details
   *
   * @example
   * ```typescript
   * // Dry run to check what would be imported
   * const preview = await importer.import(jsonString, {
   *   validateOnly: true,
   *   onDuplicate: 'skip'
   * })
   *
   * console.log(`Would import: ${preview.imported}`)
   * console.log(`Would skip: ${preview.skipped}`)
   * console.log(`Errors: ${preview.failed}`)
   * ```
   */
  async import(data: string, options?: ImportOptions): Promise<ImportResult> {
    const {
      validateOnly = false,
      onDuplicate = 'skip',
      dryRun = false,
    } = options || {}

    // Step 1: Validate JSON structure
    const parseResult = parseAndValidateJSON(data)

    if (!parseResult.valid) {
      return {
        success: false,
        total: 0,
        imported: 0,
        skipped: 0,
        failed: 0,
        errors: parseResult.errors.map((msg) => ({
          index: -1,
          message: msg,
        })),
        warnings: [],
      }
    }

    const exportData = parseResult.data as ExportData
    const total = exportData.prompts.length

    // Step 2: Validate prompts
    const { errors: validationErrors, warnings } = await batchValidatePrompts(
      exportData.prompts
    )

    // If validate only, return early
    if (validateOnly || dryRun) {
      return {
        success: validationErrors.length === 0,
        total,
        imported: 0,
        skipped: 0,
        failed: validationErrors.length,
        errors: validationErrors,
        warnings,
      }
    }

    // Step 3: Process each prompt for import
    const importErrors: ImportError[] = []
    const duplicateIndices = new Set<number>()

    for (let i = 0; i < exportData.prompts.length; i++) {
      const prompt = exportData.prompts[i]

      // Check if there are validation errors for this prompt
      const hasErrors = validationErrors.some((err) => err.index === i)
      if (hasErrors) {
        continue // Skip prompts with validation errors
      }

      // Check for duplicates
      const isDuplicate = await checkDuplicateSlug(prompt.slug)

      if (isDuplicate) {
        if (onDuplicate === 'error') {
          importErrors.push({
            index: i,
            slug: prompt.slug,
            message: 'Duplicate slug found and onDuplicate is set to error',
          })
        } else if (onDuplicate === 'skip') {
          duplicateIndices.add(i)
        }
        // For 'update', we don't mark as error or skip - it will be updated
      }
    }

    // Calculate statistics
    const failed = validationErrors.length + importErrors.length
    const skipped = duplicateIndices.size
    const imported = total - failed - skipped

    return {
      success: failed === 0,
      total,
      imported,
      skipped,
      failed,
      errors: [...validationErrors, ...importErrors],
      warnings,
    }
  }

  /**
   * Get format identifier
   */
  getFormat(): ImportFormat {
    return 'json'
  }

  /**
   * Sanitize and prepare prompts for import
   *
   * Sanitizes all text fields to prevent XSS attacks.
   * Call this before inserting prompts into database.
   *
   * @param prompts - Array of prompts to sanitize
   * @returns Sanitized prompts ready for database insert
   */
  sanitizePrompts(prompts: PromptData[]): PromptData[] {
    return prompts.map(sanitizePromptData)
  }

  /**
   * Filter out prompts that should be skipped
   *
   * Removes duplicates and prompts with errors based on import options.
   *
   * @param prompts - All prompts
   * @param errors - Import errors
   * @param duplicateIndices - Indices of duplicate prompts
   * @returns Filtered prompts ready for import
   */
  filterPromptsForImport(
    prompts: PromptData[],
    errors: ImportError[],
    duplicateIndices: Set<number>
  ): PromptData[] {
    return prompts.filter((_, index) => {
      // Skip if has errors
      const hasError = errors.some((err) => err.index === index)
      if (hasError) return false

      // Skip if duplicate
      if (duplicateIndices.has(index)) return false

      return true
    })
  }
}
