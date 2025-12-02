/**
 * Tests for API serializers
 *
 * Validates that database prompts are correctly transformed to public API format,
 * with private fields stripped and dates converted to ISO strings.
 */

import { serializePrompt, serializePromptList } from '../serializers'

describe('serializePrompt', () => {
  const mockDate = new Date('2025-12-01T10:00:00.000Z')

  const mockPrompt = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'test-prompt',
    title: 'Test Prompt',
    description: 'A test prompt description',
    prompt_text: 'This is the prompt text',
    category: 'Testing',
    author_name: 'Test Author',
    author_url: 'https://example.com',
    is_compound: false,
    featured: true,
    created_at: mockDate,
    updated_at: mockDate,
    prompt_tags: [
      {
        tags: {
          slug: 'test-tag',
          name: 'Test Tag',
        },
      },
      {
        tags: {
          slug: 'another-tag',
          name: 'Another Tag',
        },
      },
    ],
  }

  it('includes all public fields', () => {
    const result = serializePrompt(mockPrompt, 'resolved text')

    expect(result).toHaveProperty('id', mockPrompt.id)
    expect(result).toHaveProperty('slug', mockPrompt.slug)
    expect(result).toHaveProperty('title', mockPrompt.title)
    expect(result).toHaveProperty('description', mockPrompt.description)
    expect(result).toHaveProperty('prompt_text', mockPrompt.prompt_text)
    expect(result).toHaveProperty('resolved_text', 'resolved text')
    expect(result).toHaveProperty('category', mockPrompt.category)
    expect(result).toHaveProperty('author_name', mockPrompt.author_name)
    expect(result).toHaveProperty('author_url', mockPrompt.author_url)
    expect(result).toHaveProperty('is_compound', mockPrompt.is_compound)
    expect(result).toHaveProperty('featured', mockPrompt.featured)
  })

  it('converts dates to ISO strings', () => {
    const result = serializePrompt(mockPrompt, 'resolved text')

    expect(result.created_at).toBe('2025-12-01T10:00:00.000Z')
    expect(result.updated_at).toBe('2025-12-01T10:00:00.000Z')
    expect(typeof result.created_at).toBe('string')
    expect(typeof result.updated_at).toBe('string')
  })

  it('formats tags as simple array of {slug, name}', () => {
    const result = serializePrompt(mockPrompt, 'resolved text')

    expect(result.tags).toEqual([
      { slug: 'test-tag', name: 'Test Tag' },
      { slug: 'another-tag', name: 'Another Tag' },
    ])
  })

  it('handles null description', () => {
    const promptWithNullDesc = { ...mockPrompt, description: null }
    const result = serializePrompt(promptWithNullDesc, 'resolved text')

    expect(result.description).toBeNull()
  })

  it('handles null prompt_text', () => {
    const promptWithNullText = { ...mockPrompt, prompt_text: null }
    const result = serializePrompt(promptWithNullText, 'resolved text')

    expect(result.prompt_text).toBeNull()
  })

  it('handles null author_url', () => {
    const promptWithNullUrl = { ...mockPrompt, author_url: null }
    const result = serializePrompt(promptWithNullUrl, 'resolved text')

    expect(result.author_url).toBeNull()
  })

  it('handles empty tags array', () => {
    const promptWithNoTags = { ...mockPrompt, prompt_tags: [] }
    const result = serializePrompt(promptWithNoTags, 'resolved text')

    expect(result.tags).toEqual([])
  })

  it('includes resolved_text parameter', () => {
    const resolvedText = 'This is the fully resolved compound prompt text'
    const result = serializePrompt(mockPrompt, resolvedText)

    expect(result.resolved_text).toBe(resolvedText)
  })

  it('handles compound prompts', () => {
    const compoundPrompt = { ...mockPrompt, is_compound: true, prompt_text: null }
    const result = serializePrompt(compoundPrompt, 'resolved compound text')

    expect(result.is_compound).toBe(true)
    expect(result.prompt_text).toBeNull()
    expect(result.resolved_text).toBe('resolved compound text')
  })
})

describe('serializePromptList', () => {
  const mockDate = new Date('2025-12-01T10:00:00.000Z')

  const mockPrompt1 = {
    id: '111e4567-e89b-12d3-a456-426614174000',
    slug: 'prompt-one',
    title: 'Prompt One',
    description: 'First prompt',
    prompt_text: 'Text one',
    category: 'Category A',
    author_name: 'Author One',
    author_url: null,
    is_compound: false,
    featured: false,
    created_at: mockDate,
    updated_at: mockDate,
    prompt_tags: [{ tags: { slug: 'tag1', name: 'Tag 1' } }],
  }

  const mockPrompt2 = {
    id: '222e4567-e89b-12d3-a456-426614174000',
    slug: 'prompt-two',
    title: 'Prompt Two',
    description: null,
    prompt_text: null,
    category: 'Category B',
    author_name: 'Author Two',
    author_url: 'https://example.com',
    is_compound: true,
    featured: true,
    created_at: mockDate,
    updated_at: mockDate,
    prompt_tags: [],
  }

  it('serializes empty array', () => {
    const result = serializePromptList([])

    expect(result).toEqual([])
  })

  it('serializes single prompt', () => {
    const result = serializePromptList([[mockPrompt1, 'resolved one']])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(mockPrompt1.id)
    expect(result[0].slug).toBe('prompt-one')
    expect(result[0].resolved_text).toBe('resolved one')
  })

  it('serializes multiple prompts', () => {
    const result = serializePromptList([
      [mockPrompt1, 'resolved one'],
      [mockPrompt2, 'resolved two'],
    ])

    expect(result).toHaveLength(2)
    expect(result[0].slug).toBe('prompt-one')
    expect(result[1].slug).toBe('prompt-two')
    expect(result[0].resolved_text).toBe('resolved one')
    expect(result[1].resolved_text).toBe('resolved two')
  })

  it('preserves all public fields for each prompt', () => {
    const result = serializePromptList([
      [mockPrompt1, 'resolved one'],
      [mockPrompt2, 'resolved two'],
    ])

    // Check first prompt
    expect(result[0]).toHaveProperty('id')
    expect(result[0]).toHaveProperty('slug')
    expect(result[0]).toHaveProperty('title')
    expect(result[0]).toHaveProperty('resolved_text')

    // Check second prompt
    expect(result[1]).toHaveProperty('id')
    expect(result[1]).toHaveProperty('slug')
    expect(result[1]).toHaveProperty('title')
    expect(result[1]).toHaveProperty('resolved_text')
  })

  it('handles mix of compound and simple prompts', () => {
    const result = serializePromptList([
      [mockPrompt1, 'simple text'],
      [mockPrompt2, 'compound resolved text'],
    ])

    expect(result[0].is_compound).toBe(false)
    expect(result[0].prompt_text).toBe('Text one')

    expect(result[1].is_compound).toBe(true)
    expect(result[1].prompt_text).toBeNull()
  })
})
