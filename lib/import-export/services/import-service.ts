/**
 * Import Service
 *
 * Orchestrates the import process with database transactions.
 * Handles tag creation, duplicate management, and atomic operations.
 */

import { prisma } from '@/lib/db/client'
import { slugify } from '@/lib/utils/string'
import type { PromptData, ImportResult, ImportOptions, ImportError, ImportWarning } from '../types'
import { JSONImporter } from '../importers/json-importer'
import { calculateMaxDepth } from '@/lib/compound-prompts'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts'

/**
 * Import service for prompts
 *
 * Handles database operations for importing prompts with full transaction
 * support. Ensures data integrity and proper error handling.
 *
 * **Transaction Flow:**
 * 1. Validate all data (via JSONImporter)
 * 2. Begin Prisma transaction
 * 3. For each prompt:
 *    - Get or create tags
 *    - Insert or update prompt
 *    - Link tags to prompt
 * 4. Commit transaction (rollback on error)
 *
 * @example
 * ```typescript
 * const service = new ImportService()
 * const result = await service.importAll(jsonString, {
 *   onDuplicate: 'skip'
 * })
 *
 * if (result.success) {
 *   console.log(`Imported ${result.imported} prompts`)
 * } else {
 *   console.error(`Failed: ${result.errors.length} errors`)
 * }
 * ```
 */
export class ImportService {
  private jsonImporter: JSONImporter

  constructor() {
    this.jsonImporter = new JSONImporter()
  }

  /**
   * Import all prompts from JSON data
   *
   * Performs complete import with validation, duplicate handling,
   * and transactional database operations.
   *
   * **Duplicate Handling:**
   * - 'skip': Skip duplicates, keep existing (safest, default)
   * - 'update': Update existing prompts with new data
   * - 'error': Fail if duplicates found
   *
   * @param jsonData - JSON string with export data
   * @param options - Import options
   * @param userId - User performing import (for audit logging)
   * @returns Import result with statistics
   *
   * @example
   * ```typescript
   * const result = await importService.importAll(jsonData, {
   *   onDuplicate: 'skip'
   * }, userId)
   *
   * console.log(`Success: ${result.imported} imported, ${result.skipped} skipped`)
   * if (result.errors.length > 0) {
   *   result.errors.forEach(err => {
   *     console.error(`Prompt ${err.index}: ${err.message}`)
   *   })
   * }
   * ```
   */
  async importAll(
    jsonData: string,
    options?: ImportOptions,
    userId?: string
  ): Promise<ImportResult> {
    const { onDuplicate = 'skip' } = options || {}

    // Step 1: Validate and prepare data
    const importResult = await this.jsonImporter.import(jsonData, options)

    // If validation failed or validateOnly mode, return early
    if (!importResult.success || options?.validateOnly || options?.dryRun) {
      return importResult
    }

    // Step 2: Parse data for actual import
    const parseResult = await this.jsonImporter.validate(jsonData)
    if (!parseResult.valid) {
      return {
        ...importResult,
        success: false,
      }
    }

    // Get export data
    const { parseAndValidateJSON } = await import('../validators/json-validator')
    const parsed = parseAndValidateJSON(jsonData)
    if (!parsed.valid || !parsed.data) {
      return {
        ...importResult,
        success: false,
      }
    }

    const prompts = parsed.data.prompts

    // Step 3: Sanitize prompts
    const sanitizedPrompts = this.jsonImporter.sanitizePrompts(prompts)

    // Step 4: Execute import in transaction
    try {
      const result = await this.executeImport(sanitizedPrompts, onDuplicate, userId)
      return result
    } catch (error) {
      console.error('Import transaction failed:', error)
      return {
        success: false,
        total: prompts.length,
        imported: 0,
        skipped: 0,
        failed: prompts.length,
        errors: [
          {
            index: -1,
            message:
              'Transaction failed: ' + (error instanceof Error ? error.message : String(error)),
          },
        ],
        warnings: [],
      }
    }
  }

  /**
   * Execute import within Prisma transaction (Two-Pass Algorithm)
   *
   * Performs atomic database operations for importing prompts using a two-pass
   * approach to handle compound prompt dependencies:
   *
   * **Pass 1**: Import all prompt structures (metadata, no components yet)
   * - Create/update prompts with basic fields
   * - Build slug-to-ID map for Pass 2
   *
   * **Pass 2**: Create compound prompt relationships
   * - Resolve component slugs to IDs using the map
   * - Create component relationships
   * - Recalculate max_depth for each compound prompt
   *
   * Rolls back all changes if any operation fails.
   *
   * @param prompts - Sanitized prompts ready for import
   * @param onDuplicate - How to handle duplicates
   * @param userId - User performing import
   * @returns Import result
   */
  private async executeImport(
    prompts: PromptData[],
    onDuplicate: 'skip' | 'update' | 'error',
    userId?: string
  ): Promise<ImportResult> {
    let imported = 0
    let skipped = 0
    let failed = 0
    const errors: ImportError[] = []
    const warnings: ImportWarning[] = []

    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // PASS 1: Import all prompt structures
      // Build a map of slug -> prompt ID for Pass 2
      const slugToIdMap = new Map<string, string>()

      for (let i = 0; i < prompts.length; i++) {
        const prompt = prompts[i]

        try {
          // Check if prompt exists
          const existing = await tx.prompts.findFirst({
            where: {
              slug: prompt.slug,
              deleted_at: null,
            },
          })

          if (existing) {
            // Handle duplicate based on strategy
            if (onDuplicate === 'skip') {
              skipped++
              warnings.push({
                index: i,
                slug: prompt.slug,
                message: 'Skipped duplicate',
              })
              // Still add to map for component resolution
              slugToIdMap.set(prompt.slug, existing.id)
              continue
            } else if (onDuplicate === 'error') {
              failed++
              errors.push({
                index: i,
                slug: prompt.slug,
                message: 'Duplicate found and onDuplicate is error',
              })
              throw new Error(`Duplicate slug: ${prompt.slug}`)
            }
            // For 'update', continue to update logic below
          }

          // Get or create tags
          const tagIds: string[] = []
          for (const tagName of prompt.tags) {
            const tagSlug = slugify(tagName)

            // Try to find existing tag
            let tag = await tx.tags.findFirst({
              where: { slug: tagSlug },
            })

            // Create tag if it doesn't exist
            if (!tag) {
              tag = await tx.tags.create({
                data: {
                  id: crypto.randomUUID(),
                  name: tagName,
                  slug: tagSlug,
                },
              })
            }

            tagIds.push(tag.id)
          }

          if (existing && onDuplicate === 'update') {
            // Update existing prompt
            await tx.prompts.update({
              where: { id: existing.id },
              data: {
                title: prompt.title,
                prompt_text: prompt.prompt_text,
                description: prompt.description,
                example_output: prompt.example_output,
                category: prompt.category,
                author_name: prompt.author_name,
                author_url: prompt.author_url,
                status: prompt.status,
                featured: prompt.featured,
                is_compound: prompt.is_compound,
                // max_depth will be recalculated in Pass 2 for compound prompts
                max_depth: prompt.is_compound ? null : prompt.max_depth,
                updated_at: new Date(),
                // Preserve original timestamps
                approved_at: prompt.approved_at ? new Date(prompt.approved_at) : existing.approved_at,
              },
            })

            // Delete old component relationships (will be recreated in Pass 2)
            if (prompt.is_compound) {
              await tx.compound_prompt_components.deleteMany({
                where: { compound_prompt_id: existing.id },
              })
            }

            // Update tags: delete old associations, create new ones
            await tx.prompt_tags.deleteMany({
              where: { prompt_id: existing.id },
            })

            for (const tagId of tagIds) {
              await tx.prompt_tags.create({
                data: {
                  prompt_id: existing.id,
                  tag_id: tagId,
                },
              })
            }

            slugToIdMap.set(prompt.slug, existing.id)
            imported++
            warnings.push({
              index: i,
              slug: prompt.slug,
              message: 'Updated existing prompt',
            })
          } else {
            // Create new prompt
            const newPrompt = await tx.prompts.create({
              data: {
                id: crypto.randomUUID(),
                title: prompt.title,
                slug: prompt.slug,
                prompt_text: prompt.prompt_text,
                description: prompt.description,
                example_output: prompt.example_output,
                category: prompt.category,
                author_name: prompt.author_name,
                author_url: prompt.author_url,
                status: prompt.status,
                featured: prompt.featured,
                is_compound: prompt.is_compound,
                // max_depth will be calculated in Pass 2 for compound prompts
                max_depth: prompt.is_compound ? null : prompt.max_depth,
                created_at: new Date(prompt.created_at),
                updated_at: new Date(prompt.updated_at),
                approved_at: prompt.approved_at ? new Date(prompt.approved_at) : null,
                submitted_by_user_id: userId || null,
                approved_by_user_id: prompt.status === 'APPROVED' ? userId || null : null,
              },
            })

            // Link tags
            for (const tagId of tagIds) {
              await tx.prompt_tags.create({
                data: {
                  prompt_id: newPrompt.id,
                  tag_id: tagId,
                },
              })
            }

            slugToIdMap.set(prompt.slug, newPrompt.id)
            imported++
          }
        } catch (error) {
          failed++
          errors.push({
            index: i,
            slug: prompt.slug,
            message: error instanceof Error ? error.message : String(error),
          })
          // Rethrow to rollback transaction
          throw error
        }
      }

      // PASS 2: Create compound prompt components
      // Only for compound prompts that were actually imported (not skipped)
      const compoundPrompts = prompts.filter((p) => p.is_compound && p.components)

      for (let i = 0; i < compoundPrompts.length; i++) {
        const prompt = compoundPrompts[i]
        const compoundPromptId = slugToIdMap.get(prompt.slug)

        // Skip if prompt was skipped in Pass 1
        if (!compoundPromptId) continue

        try {
          await this.createCompoundComponents(
            tx,
            compoundPromptId,
            prompt.components!,
            slugToIdMap,
            i
          )
        } catch (error) {
          // Component creation errors are warnings, not failures
          // (prompt structure was successfully created)
          warnings.push({
            index: i,
            slug: prompt.slug,
            message: `Component import failed: ${error instanceof Error ? error.message : String(error)}`,
          })
        }
      }
    })

    return {
      success: failed === 0,
      total: prompts.length,
      imported,
      skipped,
      failed,
      errors,
      warnings,
    }
  }

  /**
   * Create compound prompt components
   *
   * Creates component relationships for a compound prompt during import.
   * Resolves component slugs to IDs and recalculates max_depth.
   *
   * @param tx - Prisma transaction client
   * @param compoundPromptId - ID of the compound prompt
   * @param components - Component data from import
   * @param slugToIdMap - Map of slug to prompt ID
   * @param index - Index for error reporting
   */
  private async createCompoundComponents(
    tx: any,
    compoundPromptId: string,
    components: Array<{
      position: number
      component_prompt_slug: string | null
      custom_text_before: string | null
      custom_text_after: string | null
    }>,
    slugToIdMap: Map<string, string>,
    index: number
  ): Promise<void> {
    // Validate all component slugs can be resolved
    for (const comp of components) {
      if (comp.component_prompt_slug) {
        const componentId = slugToIdMap.get(comp.component_prompt_slug)
        if (!componentId) {
          throw new Error(`Component prompt "${comp.component_prompt_slug}" not found in import`)
        }
      }
    }

    // Create all components
    for (const comp of components) {
      await tx.compound_prompt_components.create({
        data: {
          id: crypto.randomUUID(),
          compound_prompt_id: compoundPromptId,
          component_prompt_id: comp.component_prompt_slug
            ? slugToIdMap.get(comp.component_prompt_slug)!
            : null,
          position: comp.position,
          custom_text_before: comp.custom_text_before,
          custom_text_after: comp.custom_text_after,
        },
      })
    }

    // Recalculate max_depth
    const getPromptWithComponents = async (
      id: string
    ): Promise<CompoundPromptWithComponents | null> => {
      const prompt = await tx.prompts.findUnique({
        where: { id },
        include: {
          compound_components: {
            include: {
              component_prompt: true,
            },
            orderBy: { position: 'asc' },
          },
        },
      })

      if (!prompt) return null

      return {
        id: prompt.id,
        is_compound: prompt.is_compound,
        max_depth: prompt.max_depth,
        prompt_text: prompt.prompt_text,
        compound_components: prompt.compound_components.map((comp: any) => ({
          id: comp.id,
          compound_prompt_id: comp.compound_prompt_id,
          component_prompt_id: comp.component_prompt_id,
          position: comp.position,
          custom_text_before: comp.custom_text_before,
          custom_text_after: comp.custom_text_after,
          component_prompt: comp.component_prompt
            ? {
                id: comp.component_prompt.id,
                slug: comp.component_prompt.slug,
                is_compound: comp.component_prompt.is_compound,
                max_depth: comp.component_prompt.max_depth,
              }
            : null,
        })),
      }
    }

    const depth = await calculateMaxDepth(compoundPromptId, getPromptWithComponents)
    await tx.prompts.update({
      where: { id: compoundPromptId },
      data: { max_depth: depth },
    })
  }

  /**
   * Get the JSON importer instance
   *
   * Useful for accessing importer-specific methods like validate().
   */
  getJSONImporter(): JSONImporter {
    return this.jsonImporter
  }
}
