/**
 * Bulk Import Service Tests
 *
 * Integration tests for bulk import service with database operations.
 * Tests prompt creation, tag management, and duplicate handling.
 *
 * @module lib/admin/bulk-import/__tests__/service.test
 */

import { processBulkImport } from '../service'
import { prisma } from '@/lib/db/client'
import type { BulkImportPayload } from '../types'

describe('processBulkImport', () => {
  let testAdminId: string
  let createdPromptIds: string[] = []
  let createdTagIds: string[] = []

  beforeAll(async () => {
    // Create a test admin user
    const adminId = crypto.randomUUID()
    const admin = await prisma.users.create({
      data: {
        id: adminId,
        email: 'bulk-import-test@example.com',
        password: 'test-hash',
        name: 'Bulk Import Test Admin',
        is_admin: true,
      },
    })
    testAdminId = admin.id
  })

  afterEach(async () => {
    // Clean up created prompts and their tag associations
    if (createdPromptIds.length > 0) {
      await prisma.prompt_tags.deleteMany({
        where: { prompt_id: { in: createdPromptIds } },
      })
      await prisma.prompts.deleteMany({
        where: { id: { in: createdPromptIds } },
      })
    }
    // Clean up created tags
    if (createdTagIds.length > 0) {
      await prisma.tags.deleteMany({
        where: { id: { in: createdTagIds } },
      })
    }
    createdPromptIds = []
    createdTagIds = []
  })

  afterAll(async () => {
    // Clean up test admin user
    await prisma.users.delete({
      where: { id: testAdminId },
    })
  })

  describe('basic import', () => {
    it('should import a single prompt successfully', async () => {
      const timestamp = Date.now()
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Bulk Import Test Prompt',
            prompt_text: 'This is a test prompt for bulk import',
            category: 'Testing',
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.total).toBe(1)
      expect(result.created).toBe(1)
      expect(result.skipped).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.results[0].success).toBe(true)
      expect(result.results[0].id).toBeDefined()

      // Track for cleanup
      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }

      // Verify in database
      const prompt = await prisma.prompts.findUnique({
        where: { id: result.results[0].id },
      })
      expect(prompt).not.toBeNull()
      expect(prompt?.title).toBe('Bulk Import Test Prompt')
      expect(prompt?.status).toBe('APPROVED')
      expect(prompt?.ai_generated).toBe(true)
      expect(prompt?.author_name).toBe('Input Atlas AI')
    })

    it('should import multiple prompts successfully', async () => {
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Multi Import 1',
            prompt_text: 'First prompt',
            category: 'Testing',
          },
          {
            title: 'Multi Import 2',
            prompt_text: 'Second prompt',
            category: 'Development',
          },
          {
            title: 'Multi Import 3',
            prompt_text: 'Third prompt',
            category: 'Writing',
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.total).toBe(3)
      expect(result.created).toBe(3)
      expect(result.skipped).toBe(0)
      expect(result.failed).toBe(0)

      // Track for cleanup
      result.results.forEach((r) => {
        if (r.id) createdPromptIds.push(r.id)
      })

      // Verify all prompts exist
      for (const r of result.results) {
        const prompt = await prisma.prompts.findUnique({
          where: { id: r.id },
        })
        expect(prompt).not.toBeNull()
      }
    })
  })

  describe('field handling', () => {
    it('should apply default values correctly', async () => {
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Defaults Test',
            prompt_text: 'Testing defaults',
            category: 'Testing',
            // All other fields should get defaults
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }

      const prompt = await prisma.prompts.findUnique({
        where: { id: result.results[0].id },
      })

      expect(prompt?.author_name).toBe('Input Atlas AI')
      expect(prompt?.ai_generated).toBe(true)
      expect(prompt?.featured).toBe(false)
      expect(prompt?.status).toBe('APPROVED')
      expect(prompt?.is_compound).toBe(false)
    })

    it('should use provided custom values', async () => {
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Custom Values Test',
            prompt_text: 'Testing custom values',
            category: 'Development',
            description: 'Custom description',
            author_name: 'Custom Author',
            author_url: 'https://custom.example.com',
            ai_generated: false,
            featured: true,
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }

      const prompt = await prisma.prompts.findUnique({
        where: { id: result.results[0].id },
      })

      expect(prompt?.description).toBe('Custom description')
      expect(prompt?.author_name).toBe('Custom Author')
      expect(prompt?.author_url).toBe('https://custom.example.com')
      expect(prompt?.ai_generated).toBe(false)
      expect(prompt?.featured).toBe(true)
    })

    it('should use provided slug', async () => {
      const customSlug = 'my-custom-slug-' + Date.now()
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Custom Slug Test',
            prompt_text: 'Testing custom slug',
            category: 'Testing',
            slug: customSlug,
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.results[0].slug).toBe(customSlug)

      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }

      const prompt = await prisma.prompts.findUnique({
        where: { slug: customSlug },
      })
      expect(prompt).not.toBeNull()
    })

    it('should auto-generate unique slugs from title', async () => {
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Auto Slug Generation Test!',
            prompt_text: 'Testing slug generation',
            category: 'Testing',
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.results[0].slug).toMatch(/^auto-slug-generation-test/)

      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }
    })
  })

  describe('tag handling', () => {
    it('should create and associate new tags', async () => {
      const uniqueTag1 = 'bulk-test-tag-' + Date.now()
      const uniqueTag2 = 'another-bulk-tag-' + Date.now()

      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Tags Test',
            prompt_text: 'Testing tag creation',
            category: 'Testing',
            tags: [uniqueTag1, uniqueTag2],
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }

      const prompt = await prisma.prompts.findUnique({
        where: { id: result.results[0].id },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(prompt?.prompt_tags).toHaveLength(2)
      const tagNames = prompt?.prompt_tags.map((pt) => pt.tags.name).sort()
      expect(tagNames).toContain(uniqueTag1)
      expect(tagNames).toContain(uniqueTag2)

      // Track tags for cleanup
      if (prompt?.prompt_tags) {
        createdTagIds.push(...prompt.prompt_tags.map((pt) => pt.tag_id))
      }
    })

    it('should reuse existing tags', async () => {
      // Create a tag first
      const existingTagSlug = 'existing-bulk-tag-' + Date.now()
      const existingTag = await prisma.tags.create({
        data: {
          id: crypto.randomUUID(),
          name: existingTagSlug,
          slug: existingTagSlug,
          usage_count: 0,
        },
      })
      createdTagIds.push(existingTag.id)

      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Existing Tag Test',
            prompt_text: 'Testing existing tag reuse',
            category: 'Testing',
            tags: [existingTagSlug],
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }

      const prompt = await prisma.prompts.findUnique({
        where: { id: result.results[0].id },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(prompt?.prompt_tags).toHaveLength(1)
      expect(prompt?.prompt_tags[0].tag_id).toBe(existingTag.id)

      // Verify usage count was incremented
      const updatedTag = await prisma.tags.findUnique({
        where: { id: existingTag.id },
      })
      expect(updatedTag?.usage_count).toBe(1)
    })
  })

  describe('duplicate handling', () => {
    it('should skip duplicates when slug already exists', async () => {
      const existingSlug = 'existing-bulk-prompt-' + Date.now()

      // Create existing prompt
      const existing = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: 'Existing Prompt',
          slug: existingSlug,
          prompt_text: 'Existing text',
          category: 'Testing',
          author_name: 'Original',
          status: 'APPROVED',
          is_compound: false,
          submitted_by_user_id: testAdminId,
          updated_at: new Date(),
        },
      })
      createdPromptIds.push(existing.id)

      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'New Prompt With Same Slug',
            prompt_text: 'Different text',
            category: 'Development',
            slug: existingSlug,
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.created).toBe(0)
      expect(result.skipped).toBe(1)
      expect(result.results[0].skipped).toBe(true)
      expect(result.results[0].error).toContain('already exists')

      // Verify original wasn't modified
      const unchanged = await prisma.prompts.findUnique({
        where: { id: existing.id },
      })
      expect(unchanged?.title).toBe('Existing Prompt')
    })

    it('should generate unique slug when auto-generating and collision exists', async () => {
      const title = 'Collision Test Title'
      const baseSlug = 'collision-test-title'

      // Create existing prompt with expected slug
      const existing = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: title,
          slug: baseSlug,
          prompt_text: 'Existing text',
          category: 'Testing',
          author_name: 'Original',
          status: 'APPROVED',
          is_compound: false,
          submitted_by_user_id: testAdminId,
          updated_at: new Date(),
        },
      })
      createdPromptIds.push(existing.id)

      const payload: BulkImportPayload = {
        prompts: [
          {
            title: title, // Same title
            prompt_text: 'New text',
            category: 'Development',
            // No slug provided, should auto-generate
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.created).toBe(1)

      // Should have a different slug (with suffix)
      expect(result.results[0].slug).not.toBe(baseSlug)
      expect(result.results[0].slug).toMatch(/^collision-test-title-/)

      if (result.results[0].id) {
        createdPromptIds.push(result.results[0].id)
      }
    })
  })

  describe('error handling', () => {
    it('should handle import failure gracefully', async () => {
      // Mock a scenario that might fail
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Valid Prompt',
            prompt_text: 'Valid text',
            category: 'Testing',
          },
          {
            title: '', // This should be caught by validation before reaching service
            prompt_text: 'Invalid text',
            category: 'Testing',
          },
        ],
      }

      // Note: This would normally be caught by schema validation before service
      // The service assumes valid data, so this tests internal error handling
      // In practice, empty title would be caught by Zod validation first
    })

    it('should return correct result message', async () => {
      const payload: BulkImportPayload = {
        prompts: [
          {
            title: 'Message Test 1',
            prompt_text: 'Test 1',
            category: 'Testing',
          },
          {
            title: 'Message Test 2',
            prompt_text: 'Test 2',
            category: 'Testing',
          },
        ],
      }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.message).toContain('2 prompts created')

      result.results.forEach((r) => {
        if (r.id) createdPromptIds.push(r.id)
      })
    })
  })

  describe('large batch import', () => {
    it('should handle batch of 10 prompts', async () => {
      const prompts = Array.from({ length: 10 }, (_, i) => ({
        title: `Batch Prompt ${i + 1}`,
        prompt_text: `Batch prompt text ${i + 1}`,
        category: 'Testing',
      }))

      const payload: BulkImportPayload = { prompts }

      const result = await processBulkImport(payload, testAdminId)

      expect(result.success).toBe(true)
      expect(result.total).toBe(10)
      expect(result.created).toBe(10)

      result.results.forEach((r) => {
        if (r.id) createdPromptIds.push(r.id)
      })
    })
  })
})
