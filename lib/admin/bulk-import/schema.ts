/**
 * Bulk Import Validation Schema
 *
 * Zod schemas for validating bulk import JSON data.
 * Designed for admin uploads of many prompts at once.
 *
 * @module lib/admin/bulk-import/schema
 */

import { z } from 'zod'
import type { BulkImportValidationResult, BulkImportPayload } from './types'

/**
 * Schema for a single prompt in bulk import
 *
 * More permissive than the full export schema - many fields are optional
 * and will receive sensible defaults during processing.
 */
export const BulkImportPromptSchema = z.object({
  // Required fields
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less'),

  prompt_text: z
    .string()
    .min(1, 'Prompt text is required')
    .max(50000, 'Prompt text must be 50,000 characters or less'),

  category: z
    .string()
    .min(1, 'Category is required')
    .max(100, 'Category must be 100 characters or less'),

  // Optional fields with defaults applied during processing
  description: z
    .string()
    .max(2000, 'Description must be 2,000 characters or less')
    .nullable()
    .optional(),

  author_name: z
    .string()
    .max(200, 'Author name must be 200 characters or less')
    .optional(),

  author_url: z
    .string()
    .url('Author URL must be a valid URL')
    .nullable()
    .optional()
    .or(z.literal('')),

  tags: z
    .array(z.string().max(50, 'Tag must be 50 characters or less'))
    .max(20, 'Maximum 20 tags per prompt')
    .optional()
    .default([]),

  ai_generated: z.boolean().optional().default(true),

  featured: z.boolean().optional().default(false),

  slug: z
    .string()
    .max(200, 'Slug must be 200 characters or less')
    .regex(
      /^[a-z0-9-]*$/,
      'Slug must contain only lowercase letters, numbers, and hyphens'
    )
    .optional(),
})

/**
 * Schema for the complete bulk import payload
 */
export const BulkImportPayloadSchema = z.object({
  prompts: z
    .array(BulkImportPromptSchema)
    .min(1, 'At least one prompt is required')
    .max(500, 'Maximum 500 prompts per import'),
})

/**
 * Inferred TypeScript type from the schema
 */
export type ValidatedBulkImportPrompt = z.infer<typeof BulkImportPromptSchema>
export type ValidatedBulkImportPayload = z.infer<typeof BulkImportPayloadSchema>

/**
 * Validate bulk import JSON data
 *
 * Parses and validates input data against the bulk import schema.
 * Returns detailed validation errors if validation fails.
 *
 * @param data - Raw data to validate (should be parsed JSON object)
 * @returns Validation result with parsed data if valid
 *
 * @example
 * ```typescript
 * const result = validateBulkImport(jsonData)
 * if (result.valid) {
 *   console.log(`${result.data.prompts.length} prompts ready to import`)
 * } else {
 *   console.error('Validation errors:', result.errors)
 * }
 * ```
 */
export function validateBulkImport(data: unknown): BulkImportValidationResult {
  try {
    const parsed = BulkImportPayloadSchema.parse(data)

    return {
      valid: true,
      errors: [],
      data: parsed as BulkImportPayload,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
      })

      return {
        valid: false,
        errors,
      }
    }

    return {
      valid: false,
      errors: ['Unexpected validation error: ' + String(error)],
    }
  }
}

/**
 * Parse JSON string and validate as bulk import
 *
 * Convenience function that handles JSON parsing and validation in one step.
 *
 * @param jsonString - JSON string to parse and validate
 * @returns Validation result with parsed data if valid
 *
 * @example
 * ```typescript
 * const result = parseAndValidateBulkImport(fileContent)
 * if (result.valid && result.data) {
 *   await bulkImportService.processImport(result.data, userId)
 * }
 * ```
 */
export function parseAndValidateBulkImport(
  jsonString: string
): BulkImportValidationResult {
  try {
    const parsed = JSON.parse(jsonString)
    return validateBulkImport(parsed)
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        valid: false,
        errors: [`Invalid JSON: ${error.message}`],
      }
    }

    return {
      valid: false,
      errors: ['Failed to parse JSON: ' + String(error)],
    }
  }
}

/**
 * Validate a single prompt from bulk import
 *
 * Useful for validating prompts one-by-one during processing.
 *
 * @param data - Single prompt data to validate
 * @returns Validation result
 */
export function validateBulkImportPrompt(
  data: unknown
): BulkImportValidationResult {
  try {
    const parsed = BulkImportPromptSchema.parse(data)

    return {
      valid: true,
      errors: [],
      data: { prompts: [parsed] } as BulkImportPayload,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
      })

      return {
        valid: false,
        errors,
      }
    }

    return {
      valid: false,
      errors: ['Unexpected validation error: ' + String(error)],
    }
  }
}
