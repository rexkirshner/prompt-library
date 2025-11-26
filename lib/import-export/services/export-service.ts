/**
 * Export Service
 *
 * Orchestrates the export process: fetches prompts from database,
 * transforms to portable format, and delegates to format-specific exporters.
 */

import { prisma } from '@/lib/db/client'
import type { PromptData, ExportResult } from '../types'
import { JSONExporter } from '../exporters/json-exporter'

/**
 * Export service for prompts
 *
 * Handles fetching prompts from the database and converting them
 * to the portable PromptData format before exporting.
 *
 * @example
 * ```typescript
 * const service = new ExportService()
 * const result = await service.exportAll()
 *
 * if (result.success && result.data) {
 *   // Result contains formatted export data
 *   const json = JSON.stringify(result.data, null, 2)
 * }
 * ```
 */
export class ExportService {
  private jsonExporter: JSONExporter

  constructor() {
    this.jsonExporter = new JSONExporter()
  }

  /**
   * Export all prompts from the database
   *
   * Fetches all prompts with their tags and transforms them to
   * the portable export format. Excludes transient data like
   * view counts and database IDs.
   *
   * @returns Export result with all prompts
   *
   * @example
   * ```typescript
   * const result = await exportService.exportAll()
   *
   * if (!result.success) {
   *   console.error('Export failed:', result.error)
   *   return
   * }
   *
   * console.log(`Exported ${result.count} prompts`)
   * ```
   */
  async exportAll(): Promise<ExportResult> {
    try {
      // Fetch all prompts with their tags and compound components from database
      const prompts = await prisma.prompts.findMany({
        include: {
          prompt_tags: {
            include: {
              tags: true,
            },
          },
          users_prompts_submitted_by_user_idTousers: {
            select: {
              email: true,
              name: true,
            },
          },
          users_prompts_approved_by_user_idTousers: {
            select: {
              email: true,
              name: true,
            },
          },
          // NEW: Include compound components for compound prompts
          compound_components: {
            include: {
              component_prompt: {
                select: {
                  slug: true, // Get slug for portable reference
                },
              },
            },
            orderBy: {
              position: 'asc', // Maintain component order
            },
          },
        },
        where: {
          deleted_at: null, // Exclude soft-deleted prompts
        },
        orderBy: {
          created_at: 'asc', // Consistent ordering
        },
      })

      // Transform to portable format
      const promptData: PromptData[] = prompts.map((prompt) => {
        // Base prompt data
        const base: PromptData = {
          // Core content
          title: prompt.title,
          slug: prompt.slug,
          prompt_text: prompt.prompt_text,
          description: prompt.description,
          example_output: prompt.example_output,

          // Classification
          category: prompt.category,
          tags: prompt.prompt_tags.map((pt) => pt.tags.name),

          // Attribution
          author_name: prompt.author_name,
          author_url: prompt.author_url,

          // Status
          status: prompt.status,
          featured: prompt.featured,

          // Metadata (convert dates to ISO 8601 strings)
          created_at: prompt.created_at.toISOString(),
          updated_at: prompt.updated_at.toISOString(),
          approved_at: prompt.approved_at?.toISOString() || null,

          // Audit trail (optional)
          submitted_by:
            prompt.users_prompts_submitted_by_user_idTousers?.email ||
            prompt.users_prompts_submitted_by_user_idTousers?.name ||
            undefined,
          approved_by:
            prompt.users_prompts_approved_by_user_idTousers?.email ||
            prompt.users_prompts_approved_by_user_idTousers?.name ||
            undefined,

          // Compound prompt fields (v2.0+)
          is_compound: prompt.is_compound,
          max_depth: prompt.max_depth,
        }

        // Include components only if compound prompt
        if (prompt.is_compound && prompt.compound_components.length > 0) {
          base.components = prompt.compound_components.map((comp) => ({
            position: comp.position,
            component_prompt_slug: comp.component_prompt?.slug || null,
            custom_text_before: comp.custom_text_before,
            custom_text_after: comp.custom_text_after,
          }))
        }

        return base
      })

      // Use JSON exporter to create export data
      return await this.jsonExporter.export(promptData)
    } catch (error) {
      console.error('Failed to export prompts:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during export',
      }
    }
  }

  /**
   * Get the JSON exporter instance
   *
   * Useful for accessing exporter-specific methods like serialize().
   */
  getJSONExporter(): JSONExporter {
    return this.jsonExporter
  }
}
