/**
 * Import/Export Type Definitions
 *
 * Shared types and interfaces for the import/export system.
 * Defines data structures, formats, and results.
 */

import { PromptStatus } from '@prisma/client'

/**
 * Supported export/import formats
 */
export type ExportFormat = 'json'
export type ImportFormat = 'json'

/**
 * Prompt data structure for export/import
 *
 * This is a simplified, portable representation of a prompt
 * that can be serialized to various formats. It excludes
 * database-specific fields like IDs and transient data.
 */
export interface PromptData {
  // Core content
  title: string
  slug: string
  prompt_text: string
  description: string | null
  example_output: string | null

  // Classification
  category: string
  tags: string[]

  // Attribution
  author_name: string
  author_url: string | null

  // Status
  status: PromptStatus
  featured: boolean

  // Metadata (timestamps as ISO 8601 strings for portability)
  created_at: string
  updated_at: string
  approved_at: string | null

  // Audit trail (optional)
  submitted_by?: string
  approved_by?: string
}

/**
 * Complete export data structure
 *
 * Includes metadata about the export itself and an array of prompts.
 * Version field allows for schema evolution.
 */
export interface ExportData {
  /** Schema version (e.g., "1.0") */
  version: string

  /** When this export was created (ISO 8601) */
  exported_at: string

  /** Total number of prompts in this export */
  total_count: number

  /** Array of prompt data */
  prompts: PromptData[]
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** Whether export succeeded */
  success: boolean

  /** Exported data (if successful) */
  data?: ExportData

  /** Error message (if failed) */
  error?: string

  /** Number of prompts exported */
  count?: number
}

/**
 * Options for import operations
 */
export interface ImportOptions {
  /** Preview without actually importing */
  dryRun?: boolean

  /** How to handle duplicate slugs */
  onDuplicate?: 'skip' | 'update' | 'error'

  /** Only validate, don't import */
  validateOnly?: boolean
}

/**
 * Details about a single import error
 */
export interface ImportError {
  /** Which prompt index in the array */
  index: number

  /** Slug of the prompt (if available) */
  slug?: string

  /** Error message */
  message: string

  /** Field that caused the error (if applicable) */
  field?: string
}

/**
 * Warning about import operation
 */
export interface ImportWarning {
  /** Which prompt index */
  index: number

  /** Slug of the prompt */
  slug: string

  /** Warning message */
  message: string
}

/**
 * Result of an import operation
 */
export interface ImportResult {
  /** Whether import succeeded overall */
  success: boolean

  /** Total prompts in import file */
  total: number

  /** Successfully imported */
  imported: number

  /** Skipped (usually duplicates) */
  skipped: number

  /** Failed validation or import */
  failed: number

  /** Detailed errors */
  errors: ImportError[]

  /** Non-critical warnings */
  warnings: ImportWarning[]
}

/**
 * Result of validation operation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean

  /** Validation errors */
  errors: string[]

  /** Non-critical warnings */
  warnings?: string[]
}

/**
 * Base interface for exporters
 *
 * Implement this interface to add support for new export formats.
 */
export interface IExporter {
  /**
   * Export prompts to the format
   *
   * @param prompts - Array of prompt data to export
   * @returns Export result with formatted data
   */
  export(prompts: PromptData[]): Promise<ExportResult>

  /**
   * Get the format name
   */
  getFormat(): ExportFormat

  /**
   * Get the file extension for this format
   */
  getExtension(): string

  /**
   * Get the MIME type for this format
   */
  getMimeType(): string
}

/**
 * Base interface for importers
 *
 * Implement this interface to add support for new import formats.
 */
export interface IImporter {
  /**
   * Import prompts from data
   *
   * @param data - Raw data to import (JSON string, file content, etc.)
   * @param options - Import options
   * @returns Import result with statistics and errors
   */
  import(data: string, options?: ImportOptions): Promise<ImportResult>

  /**
   * Validate import data without actually importing
   *
   * @param data - Data to validate
   * @returns Validation result
   */
  validate(data: string): Promise<ValidationResult>

  /**
   * Get the format name
   */
  getFormat(): ImportFormat
}
