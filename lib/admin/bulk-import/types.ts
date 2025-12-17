/**
 * Bulk Import Types
 *
 * Type definitions for the admin bulk import feature.
 * Designed for importing many prompts at once (up to hundreds).
 *
 * @module lib/admin/bulk-import/types
 */

/**
 * Input data for a single prompt in bulk import
 *
 * This is a simplified format compared to the full export format.
 * Many fields have sensible defaults for AI-generated content.
 */
export interface BulkImportPromptInput {
  /** Prompt title (required) */
  title: string

  /** The actual prompt text (required for regular prompts) */
  prompt_text: string

  /** Optional description */
  description?: string | null

  /** Category (required) - e.g., "Development", "Writing", "Productivity" */
  category: string

  /** Author name (defaults to "Input Atlas AI") */
  author_name?: string

  /** Author URL (optional) */
  author_url?: string | null

  /** Tag names to apply (will be created if they don't exist) */
  tags?: string[]

  /** Whether this is AI-generated (defaults to true for bulk import) */
  ai_generated?: boolean

  /** Whether to feature this prompt (defaults to false) */
  featured?: boolean

  /** Custom slug (auto-generated from title if not provided) */
  slug?: string
}

/**
 * Complete bulk import payload
 */
export interface BulkImportPayload {
  /** Array of prompts to import */
  prompts: BulkImportPromptInput[]
}

/**
 * Result for a single prompt import attempt
 */
export interface BulkImportPromptResult {
  /** The title of the prompt (for identification) */
  title: string

  /** Generated or provided slug */
  slug: string

  /** Whether import was successful */
  success: boolean

  /** Database ID if created */
  id?: string

  /** Error message if failed */
  error?: string

  /** Whether this was skipped (e.g., duplicate slug) */
  skipped?: boolean
}

/**
 * Complete result of bulk import operation
 */
export interface BulkImportResult {
  /** Total number of prompts in input */
  total: number

  /** Number successfully created */
  created: number

  /** Number skipped (e.g., duplicates) */
  skipped: number

  /** Number that failed */
  failed: number

  /** Individual results for each prompt */
  results: BulkImportPromptResult[]

  /** Overall success (all prompts processed without errors) */
  success: boolean

  /** Summary message */
  message: string
}

/**
 * Validation result for bulk import
 */
export interface BulkImportValidationResult {
  /** Whether validation passed */
  valid: boolean

  /** Validation errors if any */
  errors: string[]

  /** Parsed and validated data if valid */
  data?: BulkImportPayload
}
