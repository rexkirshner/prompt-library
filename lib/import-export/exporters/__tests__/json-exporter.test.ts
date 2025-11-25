/**
 * Tests for JSON Exporter
 *
 * Tests the JSONExporter class for exporting prompts to JSON format.
 */

import { JSONExporter, EXPORT_VERSION } from '../json-exporter'
import type { PromptData } from '../../types'

describe('JSONExporter', () => {
  let exporter: JSONExporter

  beforeEach(() => {
    exporter = new JSONExporter()
  })

  describe('export', () => {
    it('exports empty array successfully', async () => {
      const prompts: PromptData[] = []
      const result = await exporter.export(prompts)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.prompts).toEqual([])
      expect(result.data?.total_count).toBe(0)
      expect(result.count).toBe(0)
    })

    it('exports single prompt correctly', async () => {
      const prompts: PromptData[] = [
        {
          title: 'Test Prompt',
          slug: 'test-prompt',
          prompt_text: 'This is a test prompt',
          description: 'Test description',
          example_output: 'Test output',
          category: 'writing',
          tags: ['test', 'example'],
          author_name: 'Test Author',
          author_url: 'https://example.com',
          status: 'APPROVED',
          featured: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          approved_at: '2024-01-01T00:00:00Z',
        },
      ]

      const result = await exporter.export(prompts)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.prompts).toEqual(prompts)
      expect(result.data?.total_count).toBe(1)
      expect(result.count).toBe(1)
    })

    it('exports multiple prompts correctly', async () => {
      const prompts: PromptData[] = [
        {
          title: 'First Prompt',
          slug: 'first-prompt',
          prompt_text: 'First prompt text',
          description: null,
          example_output: null,
          category: 'writing',
          tags: ['test'],
          author_name: 'Author 1',
          author_url: null,
          status: 'APPROVED',
          featured: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          approved_at: null,
        },
        {
          title: 'Second Prompt',
          slug: 'second-prompt',
          prompt_text: 'Second prompt text',
          description: 'Description 2',
          example_output: 'Output 2',
          category: 'coding',
          tags: ['test', 'code'],
          author_name: 'Author 2',
          author_url: 'https://example.com',
          status: 'PENDING',
          featured: true,
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          approved_at: '2024-01-03T00:00:00Z',
          submitted_by: 'user@example.com',
          approved_by: 'admin@example.com',
        },
      ]

      const result = await exporter.export(prompts)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.prompts).toEqual(prompts)
      expect(result.data?.total_count).toBe(2)
      expect(result.count).toBe(2)
    })

    it('includes correct metadata in export', async () => {
      const prompts: PromptData[] = []
      const beforeExport = new Date()
      const result = await exporter.export(prompts)
      const afterExport = new Date()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.version).toBe(EXPORT_VERSION)
      expect(result.data?.exported_at).toBeDefined()

      // Check exported_at is a valid ISO 8601 string
      const exportedAt = new Date(result.data!.exported_at)
      expect(exportedAt.toString()).not.toBe('Invalid Date')

      // Check exported_at is within reasonable time range (within 1 second)
      expect(exportedAt.getTime()).toBeGreaterThanOrEqual(beforeExport.getTime() - 1000)
      expect(exportedAt.getTime()).toBeLessThanOrEqual(afterExport.getTime() + 1000)
    })
  })

  describe('getFormat', () => {
    it('returns json format', () => {
      expect(exporter.getFormat()).toBe('json')
    })
  })

  describe('getExtension', () => {
    it('returns json extension', () => {
      expect(exporter.getExtension()).toBe('json')
    })
  })

  describe('getMimeType', () => {
    it('returns application/json mime type', () => {
      expect(exporter.getMimeType()).toBe('application/json')
    })
  })

  describe('serialize', () => {
    it('serializes export data to formatted JSON string', () => {
      const exportData = {
        version: '1.0',
        exported_at: '2024-01-01T00:00:00Z',
        total_count: 1,
        prompts: [
          {
            title: 'Test',
            slug: 'test',
            prompt_text: 'Test text',
            description: null,
            example_output: null,
            category: 'writing',
            tags: [],
            author_name: 'Test',
            author_url: null,
            status: 'APPROVED' as const,
            featured: false,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
            approved_at: null,
          },
        ],
      }

      const serialized = exporter.serialize(exportData)
      const parsed = JSON.parse(serialized)

      expect(parsed).toEqual(exportData)
    })

    it('formats JSON with indentation', () => {
      const exportData = {
        version: '1.0',
        exported_at: '2024-01-01T00:00:00Z',
        total_count: 0,
        prompts: [],
      }

      const serialized = exporter.serialize(exportData)

      // Check that it's indented (contains newlines and spaces)
      expect(serialized).toContain('\n')
      expect(serialized).toContain('  ')
    })
  })
})
