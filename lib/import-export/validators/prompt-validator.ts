/**
 * Prompt Data Validator
 *
 * Business logic validation for prompt data during import.
 * Checks for duplicates, sanitizes content, and validates business rules.
 */

import { prisma } from '@/lib/db/client'
import type { PromptData, ImportError, ImportWarning } from '../types'

/**
 * Sanitize HTML and potentially malicious content
 *
 * Removes or escapes potentially dangerous content from text fields.
 * Prevents XSS attacks via imported data.
 *
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  // Remove script tags
  let sanitized = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers (onclick, onload, etc.)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')

  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '')

  return sanitized
}

/**
 * Check if slug already exists in database
 *
 * Looks up prompts by slug to detect duplicates before import.
 * Excludes soft-deleted prompts from duplicate check.
 *
 * @param slug - Slug to check
 * @returns Promise resolving to existing prompt ID or null
 *
 * @example
 * ```typescript
 * const existingId = await checkDuplicateSlug('my-prompt-slug')
 * if (existingId) {
 *   console.log(`Duplicate found: ${existingId}`)
 * }
 * ```
 */
export async function checkDuplicateSlug(slug: string): Promise<string | null> {
  const existing = await prisma.prompts.findFirst({
    where: {
      slug,
      deleted_at: null, // Only check non-deleted prompts
    },
    select: {
      id: true,
    },
  })

  return existing?.id || null
}

/**
 * Validate prompt data for import
 *
 * Performs business logic validation on prompt data:
 * - Sanitizes text fields to prevent XSS
 * - Checks for duplicate slugs
 * - Validates business rules (e.g., approved prompts must have approved_at)
 *
 * @param prompt - Prompt data to validate
 * @param index - Index in prompts array (for error reporting)
 * @returns Object with errors and warnings arrays
 *
 * @example
 * ```typescript
 * const { errors, warnings } = await validatePromptForImport(promptData, 0)
 *
 * if (errors.length > 0) {
 *   console.error('Validation errors:', errors)
 * }
 *
 * if (warnings.length > 0) {
 *   console.warn('Validation warnings:', warnings)
 * }
 * ```
 */
export async function validatePromptForImport(
  prompt: PromptData,
  index: number
): Promise<{ errors: ImportError[]; warnings: ImportWarning[] }> {
  const errors: ImportError[] = []
  const warnings: ImportWarning[] = []

  // Check for duplicate slug
  const duplicateId = await checkDuplicateSlug(prompt.slug)
  if (duplicateId) {
    warnings.push({
      index,
      slug: prompt.slug,
      message: `Duplicate slug: prompt with slug "${prompt.slug}" already exists (ID: ${duplicateId})`,
    })
  }

  // Validate approved prompts have approved_at timestamp
  if (prompt.status === 'APPROVED' && !prompt.approved_at) {
    errors.push({
      index,
      slug: prompt.slug,
      message: 'Approved prompts must have approved_at timestamp',
      field: 'approved_at',
    })
  }

  // Validate featured prompts are approved
  if (prompt.featured && prompt.status !== 'APPROVED') {
    errors.push({
      index,
      slug: prompt.slug,
      message: 'Featured prompts must have APPROVED status',
      field: 'status',
    })
  }

  // Validate timestamps are in correct order
  // Note: Using warnings instead of errors for timestamp validation to allow
  // backup/restore round-trips where timestamp precision might vary slightly
  const createdAt = new Date(prompt.created_at)
  const updatedAt = new Date(prompt.updated_at)

  if (updatedAt < createdAt) {
    warnings.push({
      index,
      slug: prompt.slug,
      message: 'updated_at is before created_at (data may have timestamp issues)',
    })
  }

  if (prompt.approved_at) {
    const approvedAt = new Date(prompt.approved_at)
    if (approvedAt < createdAt) {
      warnings.push({
        index,
        slug: prompt.slug,
        message: 'approved_at is before created_at (data may have timestamp issues)',
      })
    }
  }

  // Warn about very long content
  if (prompt.prompt_text && prompt.prompt_text.length > 50000) {
    warnings.push({
      index,
      slug: prompt.slug,
      message: 'Prompt text is very long (>50,000 characters)',
    })
  }

  // Warn about empty descriptions for approved prompts
  if (prompt.status === 'APPROVED' && !prompt.description) {
    warnings.push({
      index,
      slug: prompt.slug,
      message: 'Approved prompt has no description',
    })
  }

  return { errors, warnings }
}

/**
 * Sanitize prompt data before import
 *
 * Applies sanitization to all text fields in prompt data.
 * Returns a new object with sanitized values (does not mutate input).
 *
 * @param prompt - Prompt data to sanitize
 * @returns Sanitized prompt data
 *
 * @example
 * ```typescript
 * const sanitized = sanitizePromptData(untrustedData)
 * // Use sanitized data for import
 * ```
 */
export function sanitizePromptData(prompt: PromptData): PromptData {
  return {
    ...prompt,
    title: sanitizeText(prompt.title),
    prompt_text: prompt.prompt_text ? sanitizeText(prompt.prompt_text) : null,
    description: prompt.description ? sanitizeText(prompt.description) : null,
    example_output: prompt.example_output ? sanitizeText(prompt.example_output) : null,
    author_name: sanitizeText(prompt.author_name),
    tags: prompt.tags.map((tag) => sanitizeText(tag)),
  }
}

/**
 * Batch validate multiple prompts
 *
 * Validates all prompts in array and collects errors/warnings.
 * Continues validation even if individual prompts fail.
 *
 * @param prompts - Array of prompts to validate
 * @returns Object with all errors and warnings
 *
 * @example
 * ```typescript
 * const { errors, warnings } = await batchValidatePrompts(promptsArray)
 *
 * console.log(`Found ${errors.length} errors and ${warnings.length} warnings`)
 * ```
 */
export async function batchValidatePrompts(
  prompts: PromptData[]
): Promise<{ errors: ImportError[]; warnings: ImportWarning[] }> {
  const allErrors: ImportError[] = []
  const allWarnings: ImportWarning[] = []

  // Validate each prompt
  for (let i = 0; i < prompts.length; i++) {
    const { errors, warnings } = await validatePromptForImport(prompts[i], i)
    allErrors.push(...errors)
    allWarnings.push(...warnings)
  }

  return {
    errors: allErrors,
    warnings: allWarnings,
  }
}
