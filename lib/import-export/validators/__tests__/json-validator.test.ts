/**
 * Tests for JSON Schema Validator
 *
 * Tests Zod schema validation for import data structure.
 */

import {
  validateExportData,
  validatePromptData,
  parseAndValidateJSON,
} from '../json-validator'
import type { PromptData, ExportData } from '../../types'

describe('JSON Schema Validator', () => {
  // Valid test data
  const validPrompt: PromptData = {
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
    submitted_by: 'user@example.com',
    approved_by: 'admin@example.com',
    is_compound: false,
    max_depth: null,
  }

  const validExportData: ExportData = {
    version: '2.0',
    exported_at: '2024-01-01T00:00:00Z',
    total_count: 1,
    prompts: [validPrompt],
  }

  describe('validateExportData', () => {
    it('accepts valid export data', () => {
      const result = validateExportData(validExportData)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('accepts export with empty prompts array', () => {
      const data = { ...validExportData, prompts: [], total_count: 0 }
      const result = validateExportData(data)

      expect(result.valid).toBe(true)
    })

    it('rejects missing version', () => {
      const { version, ...data } = validExportData
      const result = validateExportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('version'))).toBe(true)
    })

    it('rejects invalid version format', () => {
      const data = { ...validExportData, version: 'v1' }
      const result = validateExportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Version must be in format X.Y'))).toBe(true)
    })

    it('rejects missing exported_at', () => {
      const { exported_at, ...data } = validExportData
      const result = validateExportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('exported_at'))).toBe(true)
    })

    it('rejects invalid exported_at timestamp', () => {
      const data = { ...validExportData, exported_at: 'not-a-date' }
      const result = validateExportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('exported_at'))).toBe(true)
    })

    it('rejects negative total_count', () => {
      const data = { ...validExportData, total_count: -1 }
      const result = validateExportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('total_count'))).toBe(true)
    })

    it('rejects non-array prompts', () => {
      const data = { ...validExportData, prompts: 'not-an-array' }
      const result = validateExportData(data)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('prompts'))).toBe(true)
    })
  })

  describe('validatePromptData', () => {
    it('accepts valid prompt data', () => {
      const result = validatePromptData(validPrompt)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('accepts null description and example_output', () => {
      const prompt = { ...validPrompt, description: null, example_output: null }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })

    it('accepts null author_url', () => {
      const prompt = { ...validPrompt, author_url: null }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })

    it('accepts null approved_at', () => {
      const prompt = { ...validPrompt, approved_at: null }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })

    it('accepts optional fields being undefined', () => {
      const { submitted_by, approved_by, ...prompt } = validPrompt
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })

    it('rejects empty title', () => {
      const prompt = { ...validPrompt, title: '' }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('title'))).toBe(true)
    })

    it('rejects title longer than 500 characters', () => {
      const prompt = { ...validPrompt, title: 'a'.repeat(501) }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('title') && e.includes('too long'))).toBe(true)
    })

    it('rejects invalid slug format', () => {
      const prompt = { ...validPrompt, slug: 'Invalid Slug!' }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('slug'))).toBe(true)
    })

    it('accepts valid slug formats', () => {
      const validSlugs = ['simple', 'with-hyphens', 'with-123-numbers', 'a', 'a-b-c-123']

      validSlugs.forEach((slug) => {
        const prompt = { ...validPrompt, slug }
        const result = validatePromptData(prompt)
        expect(result.valid).toBe(true)
      })
    })

    it('rejects invalid status values', () => {
      const prompt = { ...validPrompt, status: 'INVALID' as any }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('status'))).toBe(true)
    })

    it('accepts all valid status values', () => {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED']

      validStatuses.forEach((status) => {
        const prompt = { ...validPrompt, status: status as any }
        const result = validatePromptData(prompt)
        expect(result.valid).toBe(true)
      })
    })

    it('rejects invalid author_url', () => {
      const prompt = { ...validPrompt, author_url: 'not-a-url' }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('author_url'))).toBe(true)
    })

    it('rejects invalid timestamp format', () => {
      const prompt = { ...validPrompt, created_at: 'not-a-date' }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('created_at'))).toBe(true)
    })

    it('rejects non-boolean featured', () => {
      const prompt = { ...validPrompt, featured: 'yes' as any }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('featured'))).toBe(true)
    })

    it('rejects non-array tags', () => {
      const prompt = { ...validPrompt, tags: 'not-array' as any }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('tags'))).toBe(true)
    })

    it('defaults to empty array for missing tags', () => {
      const { tags, ...prompt } = validPrompt
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })
  })

  describe('validatePromptData - Compound Prompts', () => {
    const validCompoundPrompt: PromptData = {
      title: 'Test Compound Prompt',
      slug: 'test-compound-prompt',
      prompt_text: null, // Compound prompts have null text
      description: 'Test compound description',
      example_output: 'Test compound output',
      category: 'writing',
      tags: ['compound', 'test'],
      author_name: 'Test Author',
      author_url: 'https://example.com',
      status: 'APPROVED',
      featured: false,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      approved_at: '2024-01-01T00:00:00Z',
      is_compound: true,
      max_depth: 2,
      components: [
        {
          position: 0,
          component_prompt_slug: 'component-1',
          custom_text_before: null,
          custom_text_after: null,
        },
        {
          position: 1,
          component_prompt_slug: null,
          custom_text_before: 'Custom text',
          custom_text_after: null,
        },
      ],
    }

    it('accepts valid compound prompt', () => {
      const result = validatePromptData(validCompoundPrompt)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    it('rejects compound prompt without components', () => {
      const prompt = { ...validCompoundPrompt, components: [] }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('Compound prompts must have at least one component'))
      ).toBe(true)
    })

    it('rejects compound prompt with missing components field', () => {
      const { components, ...prompt } = validCompoundPrompt
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('Compound prompts must have at least one component'))
      ).toBe(true)
    })

    it('rejects compound prompt with non-null prompt_text', () => {
      const prompt = { ...validCompoundPrompt, prompt_text: 'Should be null' }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('Compound prompts must have null prompt_text'))
      ).toBe(true)
    })

    it('rejects regular prompt with null prompt_text', () => {
      const prompt = { ...validPrompt, prompt_text: null }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('Regular prompts must have non-null prompt_text'))
      ).toBe(true)
    })

    it('rejects regular prompt with empty prompt_text', () => {
      const prompt = { ...validPrompt, prompt_text: '' }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(
        result.errors.some((e) => e.includes('Regular prompts must have non-null prompt_text'))
      ).toBe(true)
    })

    it('accepts compound prompt with null max_depth', () => {
      const prompt = { ...validCompoundPrompt, max_depth: null }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })

    it('rejects component with negative position', () => {
      const prompt = {
        ...validCompoundPrompt,
        components: [
          {
            position: -1,
            component_prompt_slug: 'test',
            custom_text_before: null,
            custom_text_after: null,
          },
        ],
      }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Position must be non-negative'))).toBe(true)
    })

    it('accepts component with only custom text (null slug)', () => {
      const prompt = {
        ...validCompoundPrompt,
        components: [
          {
            position: 0,
            component_prompt_slug: null,
            custom_text_before: 'Before text',
            custom_text_after: 'After text',
          },
        ],
      }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })

    it('accepts component with all null custom text', () => {
      const prompt = {
        ...validCompoundPrompt,
        components: [
          {
            position: 0,
            component_prompt_slug: 'test-slug',
            custom_text_before: null,
            custom_text_after: null,
          },
        ],
      }
      const result = validatePromptData(prompt)

      expect(result.valid).toBe(true)
    })
  })

  describe('parseAndValidateJSON', () => {
    it('parses and validates valid JSON', () => {
      const json = JSON.stringify(validExportData)
      const result = parseAndValidateJSON(json)

      expect(result.valid).toBe(true)
      expect(result.data).toEqual(validExportData)
    })

    it('rejects invalid JSON syntax', () => {
      const result = parseAndValidateJSON('{ invalid json }')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('Invalid JSON'))).toBe(true)
    })

    it('rejects valid JSON with invalid structure', () => {
      const json = JSON.stringify({ some: 'data' })
      const result = parseAndValidateJSON(json)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('rejects empty string', () => {
      const result = parseAndValidateJSON('')

      expect(result.valid).toBe(false)
      expect(result.errors.some((e) => e.includes('JSON'))).toBe(true)
    })

    it('includes parsed data on success', () => {
      const json = JSON.stringify(validExportData)
      const result = parseAndValidateJSON(json)

      expect(result.data).toBeDefined()
      expect(result.data?.version).toBe('2.0')
      expect(result.data?.prompts.length).toBe(1)
    })
  })
})
