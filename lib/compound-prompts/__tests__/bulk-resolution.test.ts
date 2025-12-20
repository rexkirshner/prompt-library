/**
 * Tests for bulk compound prompts resolution utilities
 *
 * Tests:
 * - Bulk fetching of prompts with components (no N+1)
 * - Bulk resolution of multiple prompts
 * - Handling nested compound prompts in bulk
 * - Query count optimization verification
 * - Error handling for missing prompts
 */

import { prisma } from '@/lib/db/client'
import {
  bulkFetchPromptsForResolution,
  bulkResolvePrompts,
  resolveSinglePrompt,
} from '../bulk-resolution'
import type { CompoundPromptWithComponents } from '../types'

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  prisma: {
    prompts: {
      findMany: jest.fn(),
    },
  },
}))

describe('bulkFetchPromptsForResolution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty map for empty input', async () => {
    const result = await bulkFetchPromptsForResolution([])
    expect(result.size).toBe(0)
    expect(prisma.prompts.findMany).not.toHaveBeenCalled()
  })

  it('should fetch simple prompts in one query', async () => {
    const mockPrompts = [
      {
        id: 'prompt-1',
        prompt_text: 'Simple prompt 1',
        is_compound: false,
        max_depth: null,
        title: 'Prompt 1',
        slug: 'prompt-1',
        compound_components: [],
      },
      {
        id: 'prompt-2',
        prompt_text: 'Simple prompt 2',
        is_compound: false,
        max_depth: null,
        title: 'Prompt 2',
        slug: 'prompt-2',
        compound_components: [],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    const result = await bulkFetchPromptsForResolution(['prompt-1', 'prompt-2'])

    // Should make exactly 1 query
    expect(prisma.prompts.findMany).toHaveBeenCalledTimes(1)
    expect(prisma.prompts.findMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ['prompt-1', 'prompt-2'],
        },
      },
      select: expect.any(Object),
    })

    // Should return both prompts in map
    expect(result.size).toBe(2)
    expect(result.get('prompt-1')?.prompt_text).toBe('Simple prompt 1')
    expect(result.get('prompt-2')?.prompt_text).toBe('Simple prompt 2')
  })

  it('should fetch compound prompts with components in one query', async () => {
    const mockPrompts = [
      {
        id: 'compound-1',
        prompt_text: null,
        is_compound: true,
        max_depth: 1,
        title: 'Compound Prompt 1',
        slug: 'compound-1',
        compound_components: [
          {
            id: 'comp-1',
            compound_prompt_id: 'compound-1',
            component_prompt_id: 'simple-1',
            position: 1,
            custom_text_before: 'Before: ',
            custom_text_after: ' :After',
            created_at: new Date(),
            component_prompt: {
              id: 'simple-1',
              prompt_text: 'Component text',
              is_compound: false,
              max_depth: null,
              title: 'Simple 1',
              slug: 'simple-1',
            },
          },
        ],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    const result = await bulkFetchPromptsForResolution(['compound-1'])

    // Should make exactly 1 query
    expect(prisma.prompts.findMany).toHaveBeenCalledTimes(1)

    // Should return compound prompt with components
    // Note: size is 2 because we also add the component_prompt to the map
    expect(result.size).toBe(2)
    const compound = result.get('compound-1')
    expect(compound?.is_compound).toBe(true)
    expect(compound?.compound_components).toHaveLength(1)
    expect(compound?.compound_components[0].component_prompt?.prompt_text).toBe(
      'Component text'
    )

    // Component prompt should also be in map
    const component = result.get('simple-1')
    expect(component?.prompt_text).toBe('Component text')
  })

  it('should fetch nested compound prompts in multiple queries (BFS)', async () => {
    // Level 1: Root compound prompt
    const level1Prompts = [
      {
        id: 'root',
        prompt_text: null,
        is_compound: true,
        max_depth: 2,
        title: 'Root',
        slug: 'root',
        compound_components: [
          {
            id: 'comp-1',
            compound_prompt_id: 'root',
            component_prompt_id: 'nested-compound',
            position: 1,
            custom_text_before: null,
            custom_text_after: null,
            created_at: new Date(),
            component_prompt: {
              id: 'nested-compound',
              prompt_text: null,
              is_compound: true,
              max_depth: 1,
              title: 'Nested',
              slug: 'nested',
            },
          },
        ],
      },
    ]

    // Level 2: Nested compound prompt
    const level2Prompts = [
      {
        id: 'nested-compound',
        prompt_text: null,
        is_compound: true,
        max_depth: 1,
        title: 'Nested',
        slug: 'nested',
        compound_components: [
          {
            id: 'comp-2',
            compound_prompt_id: 'nested-compound',
            component_prompt_id: 'simple',
            position: 1,
            custom_text_before: null,
            custom_text_after: null,
            created_at: new Date(),
            component_prompt: {
              id: 'simple',
              prompt_text: 'Simple text',
              is_compound: false,
              max_depth: null,
              title: 'Simple',
              slug: 'simple',
            },
          },
        ],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock)
      .mockResolvedValueOnce(level1Prompts)
      .mockResolvedValueOnce(level2Prompts)

    const result = await bulkFetchPromptsForResolution(['root'])

    // Should make 2 queries (one per level)
    expect(prisma.prompts.findMany).toHaveBeenCalledTimes(2)

    // First query: root prompt
    expect(prisma.prompts.findMany).toHaveBeenNthCalledWith(1, {
      where: { id: { in: ['root'] } },
      select: expect.any(Object),
    })

    // Second query: nested compound
    expect(prisma.prompts.findMany).toHaveBeenNthCalledWith(2, {
      where: { id: { in: ['nested-compound'] } },
      select: expect.any(Object),
    })

    // Should return all prompts (root, nested, and simple component)
    expect(result.size).toBe(3)
    expect(result.has('root')).toBe(true)
    expect(result.has('nested-compound')).toBe(true)
    expect(result.has('simple')).toBe(true)
  })

  it('should not fetch the same prompt twice', async () => {
    const mockPrompts = [
      {
        id: 'prompt-1',
        prompt_text: 'Text',
        is_compound: false,
        max_depth: null,
        title: 'Prompt',
        slug: 'prompt-1',
        compound_components: [],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    // Request same prompt twice
    const result = await bulkFetchPromptsForResolution([
      'prompt-1',
      'prompt-1',
    ])

    // Should only fetch once (deduplicated)
    expect(prisma.prompts.findMany).toHaveBeenCalledTimes(1)
    expect(result.size).toBe(1)
  })
})

describe('bulkResolvePrompts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return empty result for empty input', async () => {
    const result = await bulkResolvePrompts([])

    expect(result.resolvedTexts.size).toBe(0)
    expect(result.queriesExecuted).toBe(0)
    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(0)
  })

  it('should resolve simple prompts', async () => {
    const mockPrompts = [
      {
        id: 'simple-1',
        prompt_text: 'This is prompt 1',
        is_compound: false,
        max_depth: null,
        title: 'Simple 1',
        slug: 'simple-1',
        compound_components: [],
      },
      {
        id: 'simple-2',
        prompt_text: 'This is prompt 2',
        is_compound: false,
        max_depth: null,
        title: 'Simple 2',
        slug: 'simple-2',
        compound_components: [],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    const result = await bulkResolvePrompts(['simple-1', 'simple-2'])

    expect(result.successCount).toBe(2)
    expect(result.errorCount).toBe(0)
    expect(result.resolvedTexts.get('simple-1')).toBe('This is prompt 1')
    expect(result.resolvedTexts.get('simple-2')).toBe('This is prompt 2')
    expect(result.queriesExecuted).toBeGreaterThan(0)
  })

  it('should resolve compound prompts', async () => {
    const mockPrompts = [
      {
        id: 'compound-1',
        prompt_text: null,
        is_compound: true,
        max_depth: 1,
        title: 'Compound',
        slug: 'compound-1',
        compound_components: [
          {
            id: 'comp-1',
            compound_prompt_id: 'compound-1',
            component_prompt_id: 'simple-1',
            position: 1,
            custom_text_before: 'Start: ',
            custom_text_after: ' :End',
            created_at: new Date(),
            component_prompt: {
              id: 'simple-1',
              prompt_text: 'Middle',
              is_compound: false,
              max_depth: null,
              title: 'Simple',
              slug: 'simple-1',
            },
          },
        ],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    const result = await bulkResolvePrompts(['compound-1'])

    expect(result.successCount).toBe(1)
    expect(result.errorCount).toBe(0)
    // Resolution joins parts with double newlines
    expect(result.resolvedTexts.get('compound-1')).toBe('Start: \n\nMiddle\n\n :End')
  })

  it('should handle missing prompts gracefully', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce([])

    const result = await bulkResolvePrompts(['missing-prompt'])

    expect(result.successCount).toBe(0)
    expect(result.errorCount).toBe(1)
    expect(result.errors.get('missing-prompt')).toBe('Prompt not found')
  })

  it('should handle mix of successful and failed resolutions', async () => {
    const mockPrompts = [
      {
        id: 'good-prompt',
        prompt_text: 'Good text',
        is_compound: false,
        max_depth: null,
        title: 'Good',
        slug: 'good',
        compound_components: [],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    const result = await bulkResolvePrompts(['good-prompt', 'bad-prompt'])

    expect(result.successCount).toBe(1)
    expect(result.errorCount).toBe(1)
    expect(result.resolvedTexts.get('good-prompt')).toBe('Good text')
    expect(result.errors.get('bad-prompt')).toBe('Prompt not found')
  })

  it('should resolve nested compound prompts correctly', async () => {
    // Root compound with nested compound component
    const level1Prompts = [
      {
        id: 'root',
        prompt_text: null,
        is_compound: true,
        max_depth: 2,
        title: 'Root',
        slug: 'root',
        compound_components: [
          {
            id: 'comp-1',
            compound_prompt_id: 'root',
            component_prompt_id: 'nested',
            position: 1,
            custom_text_before: 'Before [',
            custom_text_after: '] After',
            created_at: new Date(),
            component_prompt: {
              id: 'nested',
              prompt_text: null,
              is_compound: true,
              max_depth: 1,
              title: 'Nested',
              slug: 'nested',
            },
          },
        ],
      },
    ]

    const level2Prompts = [
      {
        id: 'nested',
        prompt_text: null,
        is_compound: true,
        max_depth: 1,
        title: 'Nested',
        slug: 'nested',
        compound_components: [
          {
            id: 'comp-2',
            compound_prompt_id: 'nested',
            component_prompt_id: 'simple',
            position: 1,
            custom_text_before: null,
            custom_text_after: null,
            created_at: new Date(),
            component_prompt: {
              id: 'simple',
              prompt_text: 'Core',
              is_compound: false,
              max_depth: null,
              title: 'Simple',
              slug: 'simple',
            },
          },
        ],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock)
      .mockResolvedValueOnce(level1Prompts)
      .mockResolvedValueOnce(level2Prompts)

    const result = await bulkResolvePrompts(['root'])

    expect(result.successCount).toBe(1)
    expect(result.errorCount).toBe(0)
    // Resolution joins parts with double newlines
    expect(result.resolvedTexts.get('root')).toBe('Before [\n\nCore\n\n] After')
  })
})

describe('resolveSinglePrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should resolve a single prompt', async () => {
    const mockPrompts = [
      {
        id: 'prompt-1',
        prompt_text: 'Single prompt text',
        is_compound: false,
        max_depth: null,
        title: 'Prompt',
        slug: 'prompt-1',
        compound_components: [],
      },
    ]

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce(mockPrompts)

    const result = await resolveSinglePrompt('prompt-1')

    expect(result).toBe('Single prompt text')
  })

  it('should return empty string for missing prompt', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce([])

    const result = await resolveSinglePrompt('missing')

    expect(result).toBe('')
  })
})

describe('Query optimization verification', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should use significantly fewer queries than N+1 approach', async () => {
    // Simulate 20 prompts on browse page (10 compound, 10 simple)
    const mockPrompts = Array.from({ length: 10 }, (_, i) => ({
      id: `compound-${i}`,
      prompt_text: null,
      is_compound: true,
      max_depth: 1,
      title: `Compound ${i}`,
      slug: `compound-${i}`,
      compound_components: [
        {
          id: `comp-${i}`,
          compound_prompt_id: `compound-${i}`,
          component_prompt_id: `simple-${i}`,
          position: 1,
          custom_text_before: null,
          custom_text_after: null,
          created_at: new Date(),
          component_prompt: {
            id: `simple-${i}`,
            prompt_text: `Text ${i}`,
            is_compound: false,
            max_depth: null,
            title: `Simple ${i}`,
            slug: `simple-${i}`,
          },
        },
      ],
    }))

    const simplePrompts = Array.from({ length: 10 }, (_, i) => ({
      id: `simple-${i + 10}`,
      prompt_text: `Simple text ${i + 10}`,
      is_compound: false,
      max_depth: null,
      title: `Simple ${i + 10}`,
      slug: `simple-${i + 10}`,
      compound_components: [],
    }))

    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValueOnce([
      ...mockPrompts,
      ...simplePrompts,
    ])

    const promptIds = [
      ...mockPrompts.map((p) => p.id),
      ...simplePrompts.map((p) => p.id),
    ]

    const result = await bulkResolvePrompts(promptIds)

    // N+1 approach would make: 1 initial + 10 compound = 11 queries
    // Bulk approach should make: 1 query
    expect(prisma.prompts.findMany).toHaveBeenCalledTimes(1)

    // All prompts should resolve successfully
    expect(result.successCount).toBe(20)
    expect(result.errorCount).toBe(0)
  })
})
