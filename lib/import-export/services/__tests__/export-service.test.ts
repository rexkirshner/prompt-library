/**
 * Tests for Export Service
 *
 * Tests the ExportService class for exporting prompts from the database.
 */

import { ExportService } from '../export-service'
import { EXPORT_VERSION } from '../../exporters/json-exporter'
import { prisma } from '../../../db/client'
import { randomUUID } from 'crypto'

describe('ExportService', () => {
  let exportService: ExportService
  let testUserId: string
  let testTagId: string
  let testPromptId: string
  let deletedPromptId: string

  beforeAll(async () => {
    exportService = new ExportService()

    // Create test user with unique email
    testUserId = randomUUID()
    const uniqueEmail = `export-test-${Date.now()}@example.com`
    await prisma.users.create({
      data: {
        id: testUserId,
        email: uniqueEmail,
        password: 'hashed',
        name: 'Export Test User',
        is_admin: true,
      },
    })

    // Create test tag
    testTagId = randomUUID()
    await prisma.tags.create({
      data: {
        id: testTagId,
        name: 'export-test-tag',
        slug: 'export-test-tag',
      },
    })

    // Create test prompt (approved)
    const prompt = await prisma.prompts.create({
      data: {
        id: randomUUID(),
        title: 'Export Test Prompt',
        slug: 'export-test-prompt-' + Date.now(),
        prompt_text: 'This is a test prompt for export',
        description: 'Test description',
        example_output: 'Test output',
        category: 'writing',
        author_name: 'Test Author',
        author_url: 'https://example.com',
        status: 'APPROVED',
        featured: true,
        is_compound: false,
        max_depth: null,
        submitted_by_user_id: testUserId,
        approved_by_user_id: testUserId,
        approved_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    })
    testPromptId = prompt.id

    // Link tag to prompt
    await prisma.prompt_tags.create({
      data: {
        prompt_id: testPromptId,
        tag_id: testTagId,
      },
    })

    // Create soft-deleted prompt (should not be exported)
    const deletedPrompt = await prisma.prompts.create({
      data: {
        id: randomUUID(),
        title: 'Deleted Prompt',
        slug: 'deleted-prompt-' + Date.now(),
        prompt_text: 'This should not be exported',
        description: null,
        example_output: null,
        category: 'writing',
        author_name: 'Test Author',
        author_url: null,
        status: 'APPROVED',
        featured: false,
        is_compound: false,
        max_depth: null,
        created_at: new Date(),
        updated_at: new Date(),
        deleted_at: new Date(), // Soft deleted
      },
    })
    deletedPromptId = deletedPrompt.id
  })

  afterAll(async () => {
    // Cleanup in correct order (foreign key constraints)
    try {
      if (testPromptId) {
        await prisma.prompt_tags.deleteMany({
          where: { prompt_id: testPromptId },
        })
      }

      const promptIdsToDelete = [testPromptId, deletedPromptId].filter(Boolean)
      if (promptIdsToDelete.length > 0) {
        await prisma.prompts.deleteMany({
          where: {
            id: {
              in: promptIdsToDelete,
            },
          },
        })
      }

      if (testTagId) {
        await prisma.tags.delete({
          where: { id: testTagId },
        })
      }

      if (testUserId) {
        await prisma.users.delete({
          where: { id: testUserId },
        })
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  })

  describe('exportAll', () => {
    it('exports prompts successfully', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('includes metadata in export', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      expect(result.data?.version).toBe(EXPORT_VERSION)
      expect(result.data?.exported_at).toBeDefined()
      expect(result.data?.total_count).toBeGreaterThan(0)
    })

    it('exports prompt with correct structure', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      const exportedPrompt = result.data?.prompts.find((p) => p.slug.startsWith('export-test-prompt'))

      expect(exportedPrompt).toBeDefined()
      expect(exportedPrompt?.title).toBe('Export Test Prompt')
      expect(exportedPrompt?.prompt_text).toBe('This is a test prompt for export')
      expect(exportedPrompt?.description).toBe('Test description')
      expect(exportedPrompt?.example_output).toBe('Test output')
      expect(exportedPrompt?.category).toBe('writing')
      expect(exportedPrompt?.author_name).toBe('Test Author')
      expect(exportedPrompt?.author_url).toBe('https://example.com')
      expect(exportedPrompt?.status).toBe('APPROVED')
      expect(exportedPrompt?.featured).toBe(true)
    })

    it('includes tags in export', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      const exportedPrompt = result.data?.prompts.find((p) => p.slug.startsWith('export-test-prompt'))

      expect(exportedPrompt).toBeDefined()
      expect(exportedPrompt?.tags).toContain('export-test-tag')
    })

    it('includes timestamps as ISO 8601 strings', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      const exportedPrompt = result.data?.prompts.find((p) => p.slug.startsWith('export-test-prompt'))

      expect(exportedPrompt).toBeDefined()
      expect(exportedPrompt?.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(exportedPrompt?.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(exportedPrompt?.approved_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      // Validate they parse as valid dates
      expect(new Date(exportedPrompt!.created_at).toString()).not.toBe('Invalid Date')
      expect(new Date(exportedPrompt!.updated_at).toString()).not.toBe('Invalid Date')
    })

    it('includes audit trail information', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      const exportedPrompt = result.data?.prompts.find((p) => p.slug.startsWith('export-test-prompt'))

      expect(exportedPrompt).toBeDefined()
      // Should have either email or name
      expect(
        exportedPrompt?.submitted_by === 'export-test@example.com' ||
          exportedPrompt?.submitted_by === 'Export Test User'
      ).toBe(true)
      expect(
        exportedPrompt?.approved_by === 'export-test@example.com' ||
          exportedPrompt?.approved_by === 'Export Test User'
      ).toBe(true)
    })

    it('excludes soft-deleted prompts', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      const deletedPrompt = result.data?.prompts.find((p) => p.slug.startsWith('deleted-prompt'))

      expect(deletedPrompt).toBeUndefined()
    })

    it('excludes transient data like IDs', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      const exportedPrompt = result.data?.prompts.find((p) => p.slug.startsWith('export-test-prompt'))

      expect(exportedPrompt).toBeDefined()
      // @ts-expect-error - checking that id field is not present
      expect(exportedPrompt?.id).toBeUndefined()
      // @ts-expect-error - checking that view_count is not present
      expect(exportedPrompt?.view_count).toBeUndefined()
    })

    it('returns correct count', async () => {
      const result = await exportService.exportAll()

      expect(result.success).toBe(true)
      expect(result.count).toBe(result.data?.prompts.length)
      expect(result.count).toBe(result.data?.total_count)
    })
  })

  describe('getJSONExporter', () => {
    it('returns JSONExporter instance', () => {
      const exporter = exportService.getJSONExporter()

      expect(exporter).toBeDefined()
      expect(exporter.getFormat()).toBe('json')
    })
  })
})
