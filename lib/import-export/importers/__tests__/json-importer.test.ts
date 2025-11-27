/**
 * JSON Importer Tests
 *
 * Tests for the JSONImporter class including validation and import logic.
 */

import { JSONImporter } from '../json-importer'
import { prisma } from '@/lib/db/client'
import type { PromptData } from '../../types'

// Mock the database client
jest.mock('@/lib/db/client', () => ({
  prisma: {
    prompts: {
      findFirst: jest.fn(),
    },
  },
}))

describe('JSONImporter', () => {
  let importer: JSONImporter

  beforeEach(() => {
    importer = new JSONImporter()
    jest.clearAllMocks()
  })

  describe('validate()', () => {
    it('should validate valid export data', async () => {
      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test Prompt',
            slug: 'test-prompt',
            prompt_text: 'Test prompt text',
            description: 'Test description',
            example_output: null,
            category: 'Testing',
            tags: ['test'],
            author_name: 'Test Author',
            author_url: 'https://example.com',
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.validate(JSON.stringify(validData))

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid JSON', async () => {
      const result = await importer.validate('invalid json {')

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('Invalid JSON')
    })

    it('should reject data with missing version', async () => {
      const invalidData = {
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 0,
        prompts: [],
      }

      const result = await importer.validate(JSON.stringify(invalidData))

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('version'))).toBe(true)
    })

    it('should reject data with invalid prompt status', async () => {
      const invalidData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'INVALID_STATUS',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: null,
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.validate(JSON.stringify(invalidData))

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should detect featured prompt without APPROVED status', async () => {
      const invalidData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'PENDING',
            featured: true, // Featured but not approved
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: null,
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.validate(JSON.stringify(invalidData))

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Featured'))).toBe(true)
    })

    it('should detect approved prompt without approved_at', async () => {
      const invalidData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: null, // Missing approved_at
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.validate(JSON.stringify(invalidData))

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('approved_at'))).toBe(true)
    })

    it('should return warnings for duplicates', async () => {
      // Mock database to return existing prompt
      ;(prisma.prompts.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-id' })

      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.validate(JSON.stringify(validData))

      expect(result.valid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
      expect(result.warnings![0]).toContain('Duplicate')
    })
  })

  describe('import()', () => {
    it('should return success for valid data with validateOnly', async () => {
      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 2,
        prompts: [
          {
            title: 'Test 1',
            slug: 'test-1',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
          {
            title: 'Test 2',
            slug: 'test-2',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'PENDING',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: null,
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.import(JSON.stringify(validData), {
        validateOnly: true,
      })

      expect(result.success).toBe(true)
      expect(result.total).toBe(2)
      expect(result.imported).toBe(0) // validateOnly doesn't import
      expect(result.failed).toBe(0)
    })

    it('should handle duplicates with skip strategy', async () => {
      // Mock: first prompt is duplicate, second is not
      // Note: checkDuplicateSlug is called twice per prompt (validation + import)
      ;(prisma.prompts.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-1' }) // test-1 validation
        .mockResolvedValueOnce(null) // test-2 validation
        .mockResolvedValueOnce({ id: 'existing-1' }) // test-1 import check
        .mockResolvedValueOnce(null) // test-2 import check

      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 2,
        prompts: [
          {
            title: 'Test 1',
            slug: 'test-1',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
          {
            title: 'Test 2',
            slug: 'test-2',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.import(JSON.stringify(validData), {
        onDuplicate: 'skip',
      })

      expect(result.success).toBe(true)
      expect(result.total).toBe(2)
      expect(result.skipped).toBe(1)
      expect(result.imported).toBe(1)
    })

    it('should handle duplicates with error strategy', async () => {
      // Mock: first prompt is duplicate
      ;(prisma.prompts.findFirst as jest.Mock).mockResolvedValue({ id: 'existing-1' })

      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.import(JSON.stringify(validData), {
        onDuplicate: 'error',
      })

      expect(result.success).toBe(false)
      expect(result.failed).toBe(1)
      expect(result.errors.some((e) => e.message.includes('Duplicate'))).toBe(true)
    })

    it('should return errors for invalid JSON', async () => {
      const result = await importer.import('invalid json {')

      expect(result.success).toBe(false)
      expect(result.total).toBe(0)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should use dryRun mode', async () => {
      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      const result = await importer.import(JSON.stringify(validData), {
        dryRun: true,
      })

      expect(result.total).toBe(1)
      expect(result.imported).toBe(0) // dryRun doesn't import
    })

    it('should default to skip strategy', async () => {
      // Mock duplicate
      ;(prisma.prompts.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' })

      const validData = {
        version: '1.0',
        exported_at: '2025-01-15T10:00:00.000Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test',
            description: null,
            example_output: null,
            category: 'Test',
            tags: [],
            author_name: 'Author',
            author_url: null,
            status: 'APPROVED',
            featured: false,
            created_at: '2025-01-15T09:00:00.000Z',
            updated_at: '2025-01-15T09:00:00.000Z',
            approved_at: '2025-01-15T09:30:00.000Z',
            is_compound: false,
            max_depth: null,
          },
        ],
      }

      // No options provided - should default to skip
      const result = await importer.import(JSON.stringify(validData))

      expect(result.skipped).toBe(1)
      expect(result.failed).toBe(0)
    })
  })

  describe('sanitizePrompts()', () => {
    it('should sanitize XSS attempts', () => {
      const prompts: PromptData[] = [
        {
          title: 'Test <script>alert("xss")</script>',
          slug: 'test',
          prompt_text: 'Test onclick="alert(1)"',
          description: 'javascript:void(0)',
          example_output: null,
          category: 'Test',
          tags: [],
          author_name: 'Author',
          author_url: null,
          status: 'APPROVED',
          featured: false,
          created_at: '2025-01-15T09:00:00.000Z',
          updated_at: '2025-01-15T09:00:00.000Z',
          approved_at: '2025-01-15T09:30:00.000Z',
          is_compound: false,
          max_depth: null,
        },
      ]

      const sanitized = importer.sanitizePrompts(prompts)

      expect(sanitized[0].title).not.toContain('<script>')
      expect(sanitized[0].prompt_text).not.toContain('onclick=')
      expect(sanitized[0].description).not.toContain('javascript:')
    })

    it('should preserve safe content', () => {
      const prompts: PromptData[] = [
        {
          title: 'Safe Title',
          slug: 'safe-title',
          prompt_text: 'Safe prompt text',
          description: 'Safe description',
          example_output: null,
          category: 'Test',
          tags: ['safe', 'test'],
          author_name: 'Author',
          author_url: 'https://example.com',
          status: 'APPROVED',
          featured: false,
          created_at: '2025-01-15T09:00:00.000Z',
          updated_at: '2025-01-15T09:00:00.000Z',
          approved_at: '2025-01-15T09:30:00.000Z',
          is_compound: false,
          max_depth: null,
        },
      ]

      const sanitized = importer.sanitizePrompts(prompts)

      expect(sanitized[0].title).toBe('Safe Title')
      expect(sanitized[0].prompt_text).toBe('Safe prompt text')
      expect(sanitized[0].description).toBe('Safe description')
    })
  })

  describe('filterPromptsForImport()', () => {
    const prompts: PromptData[] = [
      {
        title: 'Prompt 1',
        slug: 'prompt-1',
        prompt_text: 'Test',
        description: null,
        example_output: null,
        category: 'Test',
        tags: [],
        author_name: 'Author',
        author_url: null,
        status: 'APPROVED',
        featured: false,
        created_at: '2025-01-15T09:00:00.000Z',
        updated_at: '2025-01-15T09:00:00.000Z',
        approved_at: '2025-01-15T09:30:00.000Z',
        is_compound: false,
        max_depth: null,
      },
      {
        title: 'Prompt 2',
        slug: 'prompt-2',
        prompt_text: 'Test',
        description: null,
        example_output: null,
        category: 'Test',
        tags: [],
        author_name: 'Author',
        author_url: null,
        status: 'APPROVED',
        featured: false,
        created_at: '2025-01-15T09:00:00.000Z',
        updated_at: '2025-01-15T09:00:00.000Z',
        approved_at: '2025-01-15T09:30:00.000Z',
        is_compound: false,
        max_depth: null,
      },
      {
        title: 'Prompt 3',
        slug: 'prompt-3',
        prompt_text: 'Test',
        description: null,
        example_output: null,
        category: 'Test',
        tags: [],
        author_name: 'Author',
        author_url: null,
        status: 'APPROVED',
        featured: false,
        created_at: '2025-01-15T09:00:00.000Z',
        updated_at: '2025-01-15T09:00:00.000Z',
        approved_at: '2025-01-15T09:30:00.000Z',
        is_compound: false,
        max_depth: null,
      },
    ]

    it('should filter out prompts with errors', () => {
      const errors = [{ index: 1, slug: 'prompt-2', message: 'Error' }]
      const duplicates = new Set<number>()

      const filtered = importer.filterPromptsForImport(prompts, errors, duplicates)

      expect(filtered).toHaveLength(2)
      expect(filtered.find((p) => p.slug === 'prompt-2')).toBeUndefined()
    })

    it('should filter out duplicate prompts', () => {
      const errors: any[] = []
      const duplicates = new Set<number>([0, 2])

      const filtered = importer.filterPromptsForImport(prompts, errors, duplicates)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].slug).toBe('prompt-2')
    })

    it('should filter out both errors and duplicates', () => {
      const errors = [{ index: 0, slug: 'prompt-1', message: 'Error' }]
      const duplicates = new Set<number>([2])

      const filtered = importer.filterPromptsForImport(prompts, errors, duplicates)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].slug).toBe('prompt-2')
    })

    it('should return all prompts if no errors or duplicates', () => {
      const errors: any[] = []
      const duplicates = new Set<number>()

      const filtered = importer.filterPromptsForImport(prompts, errors, duplicates)

      expect(filtered).toHaveLength(3)
    })
  })

  describe('getFormat()', () => {
    it('should return json format', () => {
      expect(importer.getFormat()).toBe('json')
    })
  })
})
