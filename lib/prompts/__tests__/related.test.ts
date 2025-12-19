/**
 * Tests for Related Prompts Utilities
 *
 * Tests the relevance scoring algorithm and related prompts finder.
 */

import { calculateRelevanceScore, findRelatedPrompts } from '../related'
import { prisma } from '@/lib/db/client'

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  prisma: {
    prompts: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))

describe('Related Prompts Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('calculateRelevanceScore', () => {
    it('calculates score for same category with no tags', () => {
      const score = calculateRelevanceScore(0, true, 0)
      expect(score).toBe(10) // Category match only
    })

    it('calculates score for same category with matching tags', () => {
      const score = calculateRelevanceScore(3, true, 0)
      expect(score).toBe(25) // 10 (category) + 15 (3 tags * 5)
    })

    it('calculates score for different category with matching tags', () => {
      const score = calculateRelevanceScore(2, false, 0)
      expect(score).toBe(10) // 0 (no category) + 10 (2 tags * 5)
    })

    it('adds popularity boost based on copy count', () => {
      const score = calculateRelevanceScore(0, true, 100)
      expect(score).toBe(11) // 10 (category) + 1 (100 * 0.01)
    })

    it('caps popularity boost at 10 points', () => {
      const score = calculateRelevanceScore(0, true, 2000)
      expect(score).toBe(20) // 10 (category) + 10 (capped)
    })

    it('combines all scoring factors correctly', () => {
      const score = calculateRelevanceScore(5, true, 500)
      // 10 (category) + 25 (5 tags * 5) + 5 (500 * 0.01, not capped)
      expect(score).toBe(40)
    })

    it('handles zero copy count', () => {
      const score = calculateRelevanceScore(1, false, 0)
      expect(score).toBe(5) // Just tag match
    })

    it('handles negative copy count gracefully', () => {
      const score = calculateRelevanceScore(1, true, -10)
      // Should not crash, negative popularity (-10 * 0.01 = -0.1)
      // 10 (category) + 5 (1 tag) - 0.1 = 14.9
      expect(score).toBeCloseTo(14.9, 1)
    })
  })

  describe('findRelatedPrompts', () => {
    it('returns empty array if source prompt not found', async () => {
      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(null)

      const result = await findRelatedPrompts('non-existent-id')

      expect(result).toEqual([])
      expect(prisma.prompts.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
        select: {
          category: true,
          prompt_tags: {
            select: {
              tag_id: true,
            },
          },
        },
      })
    })

    it('finds prompts in same category', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [],
      }

      const candidates = [
        {
          id: 'prompt-1',
          slug: 'test-1',
          title: 'Test 1',
          description: 'Desc 1',
          category: 'Code Review',
          author_name: 'Author',
          copy_count: 10,
          prompt_tags: [],
        },
        {
          id: 'prompt-2',
          slug: 'test-2',
          title: 'Test 2',
          description: 'Desc 2',
          category: 'Code Review',
          author_name: 'Author',
          copy_count: 5,
          prompt_tags: [],
        },
      ]

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(candidates)

      const result = await findRelatedPrompts('source-id')

      expect(result).toHaveLength(2)
      expect(result[0].sameCategory).toBe(true)
      expect(result[0].matchingTags).toBe(0)
      // Higher copy count should rank first
      expect(result[0].copy_count).toBeGreaterThan(result[1].copy_count)
    })

    it('finds prompts with matching tags', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [{ tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
      }

      const candidates = [
        {
          id: 'prompt-1',
          slug: 'test-1',
          title: 'Test 1',
          description: 'Desc 1',
          category: 'Writing',
          author_name: 'Author',
          copy_count: 0,
          prompt_tags: [
            { tags: { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' } },
            { tags: { id: 'tag-2', name: 'Tag 2', slug: 'tag-2' } },
          ],
        },
        {
          id: 'prompt-2',
          slug: 'test-2',
          title: 'Test 2',
          description: 'Desc 2',
          category: 'Writing',
          author_name: 'Author',
          copy_count: 0,
          prompt_tags: [
            { tags: { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' } },
          ],
        },
      ]

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(candidates)

      const result = await findRelatedPrompts('source-id')

      expect(result).toHaveLength(2)
      // Prompt with 2 matching tags should rank higher
      expect(result[0].matchingTags).toBe(2)
      expect(result[1].matchingTags).toBe(1)
    })

    it('respects limit option', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [],
      }

      const candidates = Array.from({ length: 10 }, (_, i) => ({
        id: `prompt-${i}`,
        slug: `test-${i}`,
        title: `Test ${i}`,
        description: `Desc ${i}`,
        category: 'Code Review',
        author_name: 'Author',
        copy_count: i,
        prompt_tags: [],
      }))

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(candidates)

      const result = await findRelatedPrompts('source-id', { limit: 3 })

      expect(result).toHaveLength(3)
    })

    it('filters by minimum tag matches', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [{ tag_id: 'tag-1' }, { tag_id: 'tag-2' }],
      }

      const candidates = [
        {
          id: 'prompt-1',
          slug: 'test-1',
          title: 'Test 1',
          description: 'Desc 1',
          category: 'Writing',
          author_name: 'Author',
          copy_count: 0,
          prompt_tags: [
            { tags: { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' } },
            { tags: { id: 'tag-2', name: 'Tag 2', slug: 'tag-2' } },
          ],
        },
        {
          id: 'prompt-2',
          slug: 'test-2',
          title: 'Test 2',
          description: 'Desc 2',
          category: 'Writing',
          author_name: 'Author',
          copy_count: 0,
          prompt_tags: [
            { tags: { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' } },
          ],
        },
      ]

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(candidates)

      const result = await findRelatedPrompts('source-id', {
        minTagMatches: 2,
      })

      expect(result).toHaveLength(1)
      expect(result[0].matchingTags).toBe(2)
    })

    it('excludes prompts from different categories when option set', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [{ tag_id: 'tag-1' }],
      }

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue([])

      await findRelatedPrompts('source-id', {
        includeDifferentCategories: false,
      })

      // Check that the where clause was called
      expect(prisma.prompts.findMany).toHaveBeenCalled()
      const callArgs = (prisma.prompts.findMany as jest.Mock).mock.calls[0][0]

      // Should only look for same category
      expect(callArgs.where.AND).toBeDefined()
    })

    it('sorts by relevance score correctly', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [{ tag_id: 'tag-1' }],
      }

      const candidates = [
        {
          id: 'prompt-1',
          slug: 'low-relevance',
          title: 'Low Relevance',
          description: 'Different category, no tags',
          category: 'Writing',
          author_name: 'Author',
          copy_count: 0,
          prompt_tags: [],
        },
        {
          id: 'prompt-2',
          slug: 'high-relevance',
          title: 'High Relevance',
          description: 'Same category + matching tag',
          category: 'Code Review',
          author_name: 'Author',
          copy_count: 100,
          prompt_tags: [
            { tags: { id: 'tag-1', name: 'Tag 1', slug: 'tag-1' } },
          ],
        },
        {
          id: 'prompt-3',
          slug: 'medium-relevance',
          title: 'Medium Relevance',
          description: 'Same category only',
          category: 'Code Review',
          author_name: 'Author',
          copy_count: 50,
          prompt_tags: [],
        },
      ]

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(candidates)

      const result = await findRelatedPrompts('source-id')

      // Should be sorted by relevance
      expect(result[0].slug).toBe('high-relevance')
      expect(result[1].slug).toBe('medium-relevance')
      expect(result[2].slug).toBe('low-relevance')
    })

    it('handles prompts with no tags correctly', async () => {
      const sourcePrompt = {
        category: 'Code Review',
        prompt_tags: [],
      }

      const candidates = [
        {
          id: 'prompt-1',
          slug: 'test-1',
          title: 'Test 1',
          description: 'Same category',
          category: 'Code Review',
          author_name: 'Author',
          copy_count: 10,
          prompt_tags: [],
        },
      ]

      ;(prisma.prompts.findUnique as jest.Mock).mockResolvedValue(sourcePrompt)
      ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(candidates)

      const result = await findRelatedPrompts('source-id')

      expect(result).toHaveLength(1)
      expect(result[0].matchingTags).toBe(0)
      expect(result[0].sameCategory).toBe(true)
    })
  })
})
