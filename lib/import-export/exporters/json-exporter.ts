/**
 * JSON Exporter
 *
 * Exports prompts to JSON format following the ExportData schema.
 * Handles data transformation from database format to portable format.
 */

import type {
  IExporter,
  ExportFormat,
  ExportResult,
  PromptData,
  ExportData,
} from '../types'

export const EXPORT_VERSION = '2.0'

/**
 * JSON format exporter
 *
 * Transforms prompt data from database format to a portable JSON structure.
 * Excludes transient data (view counts, database IDs) and formats dates
 * as ISO 8601 strings for portability.
 *
 * @example
 * ```typescript
 * const exporter = new JSONExporter()
 * const result = await exporter.export(prompts)
 *
 * if (result.success && result.data) {
 *   const json = JSON.stringify(result.data, null, 2)
 *   // Download or save JSON
 * }
 * ```
 */
export class JSONExporter implements IExporter {
  /**
   * Export prompts to JSON format
   *
   * @param prompts - Array of prompt data to export
   * @returns Export result with formatted JSON data
   */
  async export(prompts: PromptData[]): Promise<ExportResult> {
    try {
      const exportData: ExportData = {
        version: EXPORT_VERSION,
        exported_at: new Date().toISOString(),
        total_count: prompts.length,
        prompts: prompts,
      }

      return {
        success: true,
        data: exportData,
        count: prompts.length,
      }
    } catch (error) {
      console.error('Failed to export prompts to JSON:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during export',
      }
    }
  }

  /**
   * Get format identifier
   */
  getFormat(): ExportFormat {
    return 'json'
  }

  /**
   * Get file extension
   */
  getExtension(): string {
    return 'json'
  }

  /**
   * Get MIME type
   */
  getMimeType(): string {
    return 'application/json'
  }

  /**
   * Serialize export data to JSON string
   *
   * Formats with indentation for readability.
   *
   * @param data - Export data to serialize
   * @returns Formatted JSON string
   */
  serialize(data: ExportData): string {
    return JSON.stringify(data, null, 2)
  }
}
