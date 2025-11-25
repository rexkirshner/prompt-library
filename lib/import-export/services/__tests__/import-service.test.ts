/**
 * Import Service Tests
 *
 * Integration tests for ImportService with database transactions.
 * Tests actual import operations, tag management, and transaction rollback.
 */

import { ImportService } from '../import-service'
import { ExportService } from '../export-service'
import { prisma } from '@/lib/db/client'
import type { PromptData } from '../../types'

describe('ImportService', () => {
  let importService: ImportService
  let exportService: ExportService
  let testUserId: string
  let createdPromptIds: string[] = []
  let createdTagIds: string[] = []

  beforeAll(async () => {
    // Create a test user with UUID
    const userId = crypto.randomUUID()
    const user = await prisma.users.create({
      data: {
        id: userId,
        email: 'import-test@example.com',
        password: 'test-hash',
        name: 'Import Test User',
        is_admin: true,
      },
    })
    testUserId = user.id
  })

  beforeEach(() => {
    importService = new ImportService()
    exportService = new ExportService()
    createdPromptIds = []
    createdTagIds = []
  })

  afterEach(async () => {
    // Clean up created prompts and tags
    if (createdPromptIds.length > 0) {
      await prisma.prompt_tags.deleteMany({
        where: { prompt_id: { in: createdPromptIds } },
      })
      await prisma.prompts.deleteMany({
        where: { id: { in: createdPromptIds } },
      })
    }
    if (createdTagIds.length > 0) {
      await prisma.tags.deleteMany({
        where: { id: { in: createdTagIds } },
      })
    }
  })

  afterAll(async () => {
    // Clean up test user
    await prisma.users.delete({
      where: { id: testUserId },
    })
  })

  describe('importAll()', () => {
    it('should import new prompts successfully', async () => {
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 2,
        prompts: [
          {
            title: 'Import Test 1',
            slug: 'import-test-1-' + Date.now(),
            prompt_text: 'Test prompt 1',
            description: 'Test description 1',
            example_output: null,
            category: 'Testing',
            tags: ['test', 'import'],
            author_name: 'Test Author',
            author_url: 'https://example.com',
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
          {
            title: 'Import Test 2',
            slug: 'import-test-2-' + Date.now(),
            prompt_text: 'Test prompt 2',
            description: null,
            example_output: 'Example output',
            category: 'Testing',
            tags: ['test'],
            author_name: 'Test Author',
            author_url: null,
            status: 'PENDING' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: null,
          },
        ] as PromptData[],
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'skip' },
        testUserId
      )

      expect(result.success).toBe(true)
      expect(result.total).toBe(2)
      expect(result.imported).toBe(2)
      expect(result.skipped).toBe(0)
      expect(result.failed).toBe(0)

      // Verify prompts were created
      const prompt1 = await prisma.prompts.findFirst({
        where: { slug: exportData.prompts[0].slug },
        include: { prompt_tags: { include: { tags: true } } },
      })
      const prompt2 = await prisma.prompts.findFirst({
        where: { slug: exportData.prompts[1].slug },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(prompt1).not.toBeNull()
      expect(prompt2).not.toBeNull()

      if (prompt1) {
        createdPromptIds.push(prompt1.id)
        expect(prompt1.title).toBe('Import Test 1')
        expect(prompt1.status).toBe('APPROVED')
        expect(prompt1.prompt_tags).toHaveLength(2)
        createdTagIds.push(...prompt1.prompt_tags.map((pt) => pt.tag_id))
      }

      if (prompt2) {
        createdPromptIds.push(prompt2.id)
        expect(prompt2.title).toBe('Import Test 2')
        expect(prompt2.status).toBe('PENDING')
        expect(prompt2.prompt_tags).toHaveLength(1)
      }
    })

    it('should skip duplicates with skip strategy', async () => {
      // Create an existing prompt
      const existingSlug = 'existing-import-test-' + Date.now()
      const existing = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: 'Existing Prompt',
          slug: existingSlug,
          prompt_text: 'Existing prompt text',
          category: 'Testing',
          author_name: 'Original Author',
          status: 'APPROVED',
          submitted_by_user_id: testUserId,
          updated_at: new Date(),
        },
      })
      createdPromptIds.push(existing.id)

      // Try to import with the same slug
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 2,
        prompts: [
          {
            title: 'Duplicate Prompt',
            slug: existingSlug, // Same slug as existing
            prompt_text: 'New prompt text',
            description: null,
            example_output: null,
            category: 'Testing',
            tags: [],
            author_name: 'New Author',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
          {
            title: 'New Prompt',
            slug: 'new-import-test-' + Date.now(),
            prompt_text: 'New prompt text',
            description: null,
            example_output: null,
            category: 'Testing',
            tags: [],
            author_name: 'New Author',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
        ] as PromptData[],
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'skip' },
        testUserId
      )

      expect(result.success).toBe(true)
      expect(result.total).toBe(2)
      expect(result.imported).toBe(1) // Only the new one
      expect(result.skipped).toBe(1) // The duplicate
      expect(result.failed).toBe(0)

      // Verify existing prompt was not modified
      const existingAfter = await prisma.prompts.findUnique({
        where: { id: existing.id },
      })
      expect(existingAfter?.title).toBe('Existing Prompt')
      expect(existingAfter?.author_name).toBe('Original Author')

      // Verify new prompt was created
      const newPrompt = await prisma.prompts.findFirst({
        where: { slug: exportData.prompts[1].slug },
      })
      expect(newPrompt).not.toBeNull()
      if (newPrompt) {
        createdPromptIds.push(newPrompt.id)
      }
    })

    it('should update duplicates with update strategy', async () => {
      // Create an existing prompt with tags
      const existingSlug = 'update-test-' + Date.now()
      const tag1 = await prisma.tags.create({
        data: { id: crypto.randomUUID(), name: 'Old Tag', slug: 'old-tag-' + Date.now() },
      })
      createdTagIds.push(tag1.id)

      const existing = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: 'Old Title',
          slug: existingSlug,
          prompt_text: 'Old text',
          category: 'Old Category',
          author_name: 'Old Author',
          status: 'PENDING',
          submitted_by_user_id: testUserId,
          updated_at: new Date(),
        },
      })
      createdPromptIds.push(existing.id)

      await prisma.prompt_tags.create({
        data: {
          prompt_id: existing.id,
          tag_id: tag1.id,
        },
      })

      // Import with update strategy
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 1,
        prompts: [
          {
            title: 'New Title',
            slug: existingSlug,
            prompt_text: 'New text',
            description: 'New description',
            example_output: null,
            category: 'New Category',
            tags: ['new-tag'],
            author_name: 'New Author',
            author_url: 'https://new.example.com',
            status: 'APPROVED' as const,
            featured: true,
            created_at: existing.created_at.toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
        ] as PromptData[],
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'update' },
        testUserId
      )

      expect(result.success).toBe(true)
      expect(result.imported).toBe(1)
      expect(result.skipped).toBe(0)
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0].message).toContain('Updated')

      // Verify prompt was updated
      const updated = await prisma.prompts.findUnique({
        where: { id: existing.id },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(updated).not.toBeNull()
      expect(updated?.title).toBe('New Title')
      expect(updated?.prompt_text).toBe('New text')
      expect(updated?.category).toBe('New Category')
      expect(updated?.status).toBe('APPROVED')
      expect(updated?.featured).toBe(true)

      // Verify tags were updated
      expect(updated?.prompt_tags).toHaveLength(1)
      expect(updated?.prompt_tags[0].tags.name).toBe('new-tag')

      // Track new tag for cleanup
      if (updated?.prompt_tags[0]) {
        createdTagIds.push(updated.prompt_tags[0].tag_id)
      }
    })

    it('should fail with error strategy on duplicates', async () => {
      // Create an existing prompt
      const existingSlug = 'error-test-' + Date.now()
      const existing = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: 'Existing',
          slug: existingSlug,
          prompt_text: 'Test',
          category: 'Test',
          author_name: 'Test',
          status: 'APPROVED',
          submitted_by_user_id: testUserId,
          updated_at: new Date(),
        },
      })
      createdPromptIds.push(existing.id)

      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 1,
        prompts: [
          {
            title: 'Duplicate',
            slug: existingSlug,
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Test',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
        ] as PromptData[],
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'error' },
        testUserId
      )

      expect(result.success).toBe(false)
      expect(result.failed).toBe(1)
      expect(result.errors[0].message).toContain('Duplicate')
    })

    it('should create tags if they do not exist', async () => {
      const uniqueTag1 = 'unique-tag-' + Date.now()
      const uniqueTag2 = 'another-tag-' + Date.now()

      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 1,
        prompts: [
          {
            title: 'Tag Test',
            slug: 'tag-test-' + Date.now(),
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [uniqueTag1, uniqueTag2],
            author_name: 'Test',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
        ] as PromptData[],
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'skip' },
        testUserId
      )

      expect(result.success).toBe(true)
      expect(result.imported).toBe(1)

      // Verify tags were created
      const prompt = await prisma.prompts.findFirst({
        where: { slug: exportData.prompts[0].slug },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(prompt).not.toBeNull()
      if (prompt) {
        createdPromptIds.push(prompt.id)
        expect(prompt.prompt_tags).toHaveLength(2)

        const tagNames = prompt.prompt_tags.map((pt) => pt.tags.name).sort()
        expect(tagNames).toContain(uniqueTag1)
        expect(tagNames).toContain(uniqueTag2)

        // Track tags for cleanup
        createdTagIds.push(...prompt.prompt_tags.map((pt) => pt.tag_id))
      }
    })

    it('should rollback transaction on error', async () => {
      // Create invalid data that will fail during import
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 2,
        prompts: [
          {
            title: 'Valid Prompt',
            slug: 'rollback-test-1-' + Date.now(),
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Test',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
          {
            title: 'Invalid Prompt',
            slug: 'rollback-test-2-' + Date.now(),
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Test',
            author_url: null,
            status: 'APPROVED' as const,
            featured: true, // Featured
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: null, // But no approved_at - this will fail validation
          },
        ] as any,
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'skip' },
        testUserId
      )

      // Import should fail
      expect(result.success).toBe(false)

      // Verify first prompt was NOT created (transaction rolled back)
      const prompt1 = await prisma.prompts.findFirst({
        where: { slug: exportData.prompts[0].slug },
      })
      expect(prompt1).toBeNull()
    })

    it('should validate data before importing', async () => {
      const invalidData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 1,
        prompts: [
          {
            // Missing required fields
            slug: 'invalid-test',
          },
        ],
      }

      const result = await importService.importAll(
        JSON.stringify(invalidData),
        { onDuplicate: 'skip' },
        testUserId
      )

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should use validateOnly mode', async () => {
      const exportData = {
        version: '1.0',
        exported_at: new Date().toISOString(),
        total_count: 1,
        prompts: [
          {
            title: 'Validate Only Test',
            slug: 'validate-only-' + Date.now(),
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Test',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approved_at: new Date().toISOString(),
          },
        ] as PromptData[],
      }

      const result = await importService.importAll(
        JSON.stringify(exportData),
        { validateOnly: true },
        testUserId
      )

      expect(result.total).toBe(1)

      // Verify prompt was NOT created
      const prompt = await prisma.prompts.findFirst({
        where: { slug: exportData.prompts[0].slug },
      })
      expect(prompt).toBeNull()
    })
  })

  describe('Round-trip export/import', () => {
    it('should successfully export and re-import a single prompt', async () => {
      // Create test prompt with proper timestamps
      const now = new Date()
      const createdAt = new Date(now.getTime() - 10000) // 10 seconds ago
      const approvedAt = new Date(now.getTime() - 5000) // 5 seconds ago

      const tag1 = await prisma.tags.create({
        data: { id: crypto.randomUUID(), name: 'Round Trip Tag', slug: 'round-trip-tag-' + Date.now() },
      })
      createdTagIds.push(tag1.id)

      const prompt1 = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: 'Round Trip Test 1',
          slug: 'round-trip-1-' + Date.now(),
          prompt_text: 'Round trip test prompt',
          description: 'Test description',
          category: 'Testing',
          author_name: 'Test Author',
          status: 'APPROVED',
          featured: true,
          submitted_by_user_id: testUserId,
          approved_by_user_id: testUserId,
          created_at: createdAt,
          approved_at: approvedAt,
          updated_at: now,
        },
      })
      createdPromptIds.push(prompt1.id)

      await prisma.prompt_tags.create({
        data: {
          prompt_id: prompt1.id,
          tag_id: tag1.id,
        },
      })

      // Manually create export data with just this prompt
      const exportData = {
        version: '1.0',
        exported_at: now.toISOString(),
        total_count: 1,
        prompts: [
          {
            title: prompt1.title,
            slug: prompt1.slug,
            prompt_text: prompt1.prompt_text,
            description: prompt1.description,
            example_output: null,
            category: prompt1.category,
            tags: ['Round Trip Tag'],
            author_name: prompt1.author_name,
            author_url: null,
            status: prompt1.status,
            featured: prompt1.featured,
            created_at: createdAt.toISOString(),
            updated_at: now.toISOString(),
            approved_at: approvedAt.toISOString(),
          },
        ],
      }

      // Delete the prompt and tag to simulate fresh import
      await prisma.prompt_tags.deleteMany({ where: { prompt_id: prompt1.id } })
      await prisma.prompts.delete({ where: { id: prompt1.id } })
      await prisma.tags.delete({ where: { id: tag1.id } })
      createdPromptIds = createdPromptIds.filter((id) => id !== prompt1.id)
      createdTagIds = createdTagIds.filter((id) => id !== tag1.id)

      // Re-import
      const importResult = await importService.importAll(
        JSON.stringify(exportData),
        { onDuplicate: 'skip' },
        testUserId
      )

      if (!importResult.success) {
        console.log('Import failed:', JSON.stringify(importResult, null, 2))
      }

      expect(importResult.success).toBe(true)
      expect(importResult.imported).toBe(1)

      // Verify prompt was re-created
      const reimported = await prisma.prompts.findFirst({
        where: { slug: prompt1.slug },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(reimported).not.toBeNull()
      if (reimported) {
        createdPromptIds.push(reimported.id)
        expect(reimported.title).toBe(prompt1.title)
        expect(reimported.prompt_text).toBe(prompt1.prompt_text)
        expect(reimported.status).toBe('APPROVED')
        expect(reimported.featured).toBe(true)
        expect(reimported.prompt_tags).toHaveLength(1)
        expect(reimported.prompt_tags[0].tags.name).toBe('Round Trip Tag')
      }
    })
  })
})
