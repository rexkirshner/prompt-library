/**
 * JSON Schema Validator
 *
 * Validates import data against the expected JSON schema using Zod.
 * Provides type-safe validation with detailed error messages.
 */

import { z } from 'zod'
import type { ValidationResult } from '../types'

/**
 * Zod schema for PromptStatus enum
 */
const PromptStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

/**
 * Zod schema for PromptData
 *
 * Validates individual prompt data structure with all required fields,
 * optional fields, and data type constraints.
 */
export const PromptDataSchema = z.object({
  // Core content - all required except description and example_output
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(200, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  prompt_text: z.string().min(1, 'Prompt text is required'),
  description: z.string().nullable(),
  example_output: z.string().nullable(),

  // Classification
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).default([]),

  // Attribution
  author_name: z.string().min(1, 'Author name is required'),
  author_url: z.string().url('Invalid author URL').nullable().or(z.literal(null)),

  // Status
  status: PromptStatusSchema,
  featured: z.boolean(),

  // Metadata (ISO 8601 strings)
  created_at: z.string().datetime('Invalid created_at timestamp'),
  updated_at: z.string().datetime('Invalid updated_at timestamp'),
  approved_at: z.string().datetime('Invalid approved_at timestamp').nullable(),

  // Audit trail (optional)
  submitted_by: z.string().optional(),
  approved_by: z.string().optional(),
})

/**
 * Zod schema for ExportData
 *
 * Validates the complete export file structure including metadata
 * and array of prompts.
 */
export const ExportDataSchema = z.object({
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y'),
  exported_at: z.string().datetime('Invalid exported_at timestamp'),
  total_count: z.number().int().nonnegative('Total count must be non-negative'),
  prompts: z.array(PromptDataSchema),
})

/**
 * Validate JSON structure against ExportData schema
 *
 * Performs comprehensive validation of import file structure using Zod.
 * Returns detailed validation result with all error messages.
 *
 * @param data - Raw data to validate (should be parsed JSON)
 * @returns Validation result with success flag and errors
 *
 * @example
 * ```typescript
 * const jsonData = JSON.parse(fileContent)
 * const result = validateExportData(jsonData)
 *
 * if (!result.valid) {
 *   console.error('Validation errors:', result.errors)
 *   result.errors.forEach(error => console.error(error))
 * }
 * ```
 */
export function validateExportData(data: unknown): ValidationResult {
  try {
    // Attempt to parse with Zod schema
    ExportDataSchema.parse(data)

    return {
      valid: true,
      errors: [],
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Extract detailed error messages from Zod
      const errors = error.errors.map((err) => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
      })

      return {
        valid: false,
        errors,
      }
    }

    // Unexpected error type
    return {
      valid: false,
      errors: ['Unexpected validation error: ' + String(error)],
    }
  }
}

/**
 * Validate individual prompt data
 *
 * Validates a single prompt against the PromptData schema.
 * Useful for validating prompts one-by-one during processing.
 *
 * @param data - Prompt data to validate
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validatePromptData(promptData)
 * if (!result.valid) {
 *   console.error(`Prompt "${promptData.title}" failed validation:`)
 *   result.errors.forEach(err => console.error('  -', err))
 * }
 * ```
 */
export function validatePromptData(data: unknown): ValidationResult {
  try {
    PromptDataSchema.parse(data)

    return {
      valid: true,
      errors: [],
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map((err) => {
        const path = err.path.join('.')
        return `${path}: ${err.message}`
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
 * Parse and validate JSON string
 *
 * Convenience function that parses JSON string and validates it
 * in one step. Returns both parsed data and validation result.
 *
 * @param jsonString - JSON string to parse and validate
 * @returns Validation result with parsed data if successful
 *
 * @example
 * ```typescript
 * const result = parseAndValidateJSON(fileContent)
 *
 * if (result.valid && result.data) {
 *   console.log(`Valid export with ${result.data.total_count} prompts`)
 *   // Process result.data
 * } else {
 *   console.error('Invalid JSON or structure:', result.errors)
 * }
 * ```
 */
export function parseAndValidateJSON(
  jsonString: string
): ValidationResult & { data?: z.infer<typeof ExportDataSchema> } {
  try {
    // Parse JSON
    const parsed = JSON.parse(jsonString)

    // Validate structure
    const result = validateExportData(parsed)

    if (result.valid) {
      return {
        ...result,
        data: parsed as z.infer<typeof ExportDataSchema>,
      }
    }

    return result
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
