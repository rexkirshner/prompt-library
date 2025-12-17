/**
 * Tests for Bulk Import Validation Schema
 *
 * Validates the Zod schemas and helper functions for bulk import JSON validation.
 *
 * @module lib/admin/bulk-import/__tests__/schema.test
 */

import {
  validateBulkImport,
  parseAndValidateBulkImport,
  validateBulkImportPrompt,
  BulkImportPromptSchema,
  BulkImportPayloadSchema,
} from '../schema'

describe('BulkImportPromptSchema', () => {
  describe('required fields', () => {
    it('accepts valid prompt with all required fields', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Test Prompt')
        expect(result.data.prompt_text).toBe('This is the prompt text')
        expect(result.data.category).toBe('Testing')
      }
    })

    it('rejects missing title', () => {
      const result = BulkImportPromptSchema.safeParse({
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      })

      expect(result.success).toBe(false)
    })

    it('rejects empty title', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: '',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      })

      expect(result.success).toBe(false)
    })

    it('rejects missing prompt_text', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        category: 'Testing',
      })

      expect(result.success).toBe(false)
    })

    it('rejects empty prompt_text', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: '',
        category: 'Testing',
      })

      expect(result.success).toBe(false)
    })

    it('rejects missing category', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
      })

      expect(result.success).toBe(false)
    })

    it('rejects empty category', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: '',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('optional fields', () => {
    it('accepts all optional fields', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        description: 'A description',
        author_name: 'Test Author',
        author_url: 'https://example.com',
        tags: ['tag1', 'tag2'],
        ai_generated: false,
        featured: true,
        slug: 'test-prompt',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('A description')
        expect(result.data.author_name).toBe('Test Author')
        expect(result.data.author_url).toBe('https://example.com')
        expect(result.data.tags).toEqual(['tag1', 'tag2'])
        expect(result.data.ai_generated).toBe(false)
        expect(result.data.featured).toBe(true)
        expect(result.data.slug).toBe('test-prompt')
      }
    })

    it('applies default values for optional fields', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual([])
        expect(result.data.ai_generated).toBe(true)
        expect(result.data.featured).toBe(false)
      }
    })

    it('accepts null description', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        description: null,
      })

      expect(result.success).toBe(true)
    })

    it('accepts null author_url', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        author_url: null,
      })

      expect(result.success).toBe(true)
    })

    it('accepts empty string author_url', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        author_url: '',
      })

      expect(result.success).toBe(true)
    })
  })

  describe('field length limits', () => {
    it('rejects title over 500 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'a'.repeat(501),
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      })

      expect(result.success).toBe(false)
    })

    it('rejects prompt_text over 50000 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'a'.repeat(50001),
        category: 'Testing',
      })

      expect(result.success).toBe(false)
    })

    it('rejects category over 100 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'a'.repeat(101),
      })

      expect(result.success).toBe(false)
    })

    it('rejects description over 2000 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        description: 'a'.repeat(2001),
      })

      expect(result.success).toBe(false)
    })

    it('rejects author_name over 200 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        author_name: 'a'.repeat(201),
      })

      expect(result.success).toBe(false)
    })

    it('rejects slug over 200 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        slug: 'a'.repeat(201),
      })

      expect(result.success).toBe(false)
    })

    it('rejects tag over 50 characters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        tags: ['a'.repeat(51)],
      })

      expect(result.success).toBe(false)
    })

    it('rejects more than 20 tags', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
      })

      expect(result.success).toBe(false)
    })
  })

  describe('slug validation', () => {
    it('accepts valid slug with lowercase letters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        slug: 'test-prompt',
      })

      expect(result.success).toBe(true)
    })

    it('accepts valid slug with numbers', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        slug: 'test-prompt-123',
      })

      expect(result.success).toBe(true)
    })

    it('rejects slug with uppercase letters', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        slug: 'Test-Prompt',
      })

      expect(result.success).toBe(false)
    })

    it('rejects slug with spaces', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        slug: 'test prompt',
      })

      expect(result.success).toBe(false)
    })

    it('rejects slug with underscores', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        slug: 'test_prompt',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('URL validation', () => {
    it('accepts valid URL', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        author_url: 'https://example.com/author',
      })

      expect(result.success).toBe(true)
    })

    it('rejects invalid URL', () => {
      const result = BulkImportPromptSchema.safeParse({
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
        author_url: 'not-a-url',
      })

      expect(result.success).toBe(false)
    })
  })
})

describe('BulkImportPayloadSchema', () => {
  const validPrompt = {
    title: 'Test Prompt',
    prompt_text: 'This is the prompt text',
    category: 'Testing',
  }

  it('accepts payload with single prompt', () => {
    const result = BulkImportPayloadSchema.safeParse({
      prompts: [validPrompt],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.prompts).toHaveLength(1)
    }
  })

  it('accepts payload with multiple prompts', () => {
    const result = BulkImportPayloadSchema.safeParse({
      prompts: [
        validPrompt,
        { ...validPrompt, title: 'Second Prompt' },
        { ...validPrompt, title: 'Third Prompt' },
      ],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.prompts).toHaveLength(3)
    }
  })

  it('rejects empty prompts array', () => {
    const result = BulkImportPayloadSchema.safeParse({
      prompts: [],
    })

    expect(result.success).toBe(false)
  })

  it('rejects more than 500 prompts', () => {
    const result = BulkImportPayloadSchema.safeParse({
      prompts: Array.from({ length: 501 }, (_, i) => ({
        ...validPrompt,
        title: `Prompt ${i}`,
      })),
    })

    expect(result.success).toBe(false)
  })

  it('accepts exactly 500 prompts', () => {
    const result = BulkImportPayloadSchema.safeParse({
      prompts: Array.from({ length: 500 }, (_, i) => ({
        ...validPrompt,
        title: `Prompt ${i}`,
      })),
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing prompts field', () => {
    const result = BulkImportPayloadSchema.safeParse({})

    expect(result.success).toBe(false)
  })

  it('rejects invalid prompt in array', () => {
    const result = BulkImportPayloadSchema.safeParse({
      prompts: [
        validPrompt,
        { title: 'Missing required fields' }, // Missing prompt_text and category
      ],
    })

    expect(result.success).toBe(false)
  })
})

describe('validateBulkImport', () => {
  const validPayload = {
    prompts: [
      {
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      },
    ],
  }

  it('returns valid result for valid payload', () => {
    const result = validateBulkImport(validPayload)

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.data).toBeDefined()
    expect(result.data?.prompts).toHaveLength(1)
  })

  it('returns invalid result with errors for invalid payload', () => {
    const result = validateBulkImport({
      prompts: [{ title: '' }],
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.data).toBeUndefined()
  })

  it('includes field path in error messages', () => {
    const result = validateBulkImport({
      prompts: [{ title: '', prompt_text: 'text', category: 'cat' }],
    })

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('prompts.0.title'))).toBe(true)
  })

  it('handles non-object input gracefully', () => {
    const result = validateBulkImport('not an object')

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles null input gracefully', () => {
    const result = validateBulkImport(null)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles undefined input gracefully', () => {
    const result = validateBulkImport(undefined)

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('parseAndValidateBulkImport', () => {
  const validPayload = {
    prompts: [
      {
        title: 'Test Prompt',
        prompt_text: 'This is the prompt text',
        category: 'Testing',
      },
    ],
  }

  it('parses and validates valid JSON string', () => {
    const result = parseAndValidateBulkImport(JSON.stringify(validPayload))

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.data?.prompts).toHaveLength(1)
  })

  it('returns error for invalid JSON syntax', () => {
    const result = parseAndValidateBulkImport('{ invalid json }')

    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('Invalid JSON'))).toBe(true)
  })

  it('returns error for valid JSON but invalid payload', () => {
    const result = parseAndValidateBulkImport(JSON.stringify({ prompts: [] }))

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles empty string', () => {
    const result = parseAndValidateBulkImport('')

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})

describe('validateBulkImportPrompt', () => {
  it('validates single valid prompt', () => {
    const result = validateBulkImportPrompt({
      title: 'Test Prompt',
      prompt_text: 'This is the prompt text',
      category: 'Testing',
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
    expect(result.data?.prompts).toHaveLength(1)
  })

  it('returns errors for invalid single prompt', () => {
    const result = validateBulkImportPrompt({
      title: '',
      prompt_text: 'text',
      category: 'cat',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('handles missing fields', () => {
    const result = validateBulkImportPrompt({
      title: 'Test',
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })
})
