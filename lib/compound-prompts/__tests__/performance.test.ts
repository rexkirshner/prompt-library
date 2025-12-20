/**
 * Performance Benchmark Tests for Compound Prompt Resolution
 *
 * Tests query count optimization to ensure bulk resolution
 * significantly reduces database operations.
 *
 * @jest-environment node
 */

import { bulkResolvePrompts, resolveSinglePrompt } from '../bulk-resolution'
import { prisma } from '@/lib/db/client'

describe('Compound Prompt Performance Benchmarks', () => {
  let testFixtureIds: string[] = []
  let compoundPromptIds: string[] = []

  beforeAll(async () => {
    // Find all test fixture prompts
    const fixtures = await prisma.prompts.findMany({
      where: {
        slug: {
          startsWith: 'test-fixture-',
        },
      },
      select: {
        id: true,
        is_compound: true,
      },
    })

    testFixtureIds = fixtures.map((f) => f.id)
    compoundPromptIds = fixtures.filter((f) => f.is_compound).map((f) => f.id)
  })

  describe('Query Count Optimization', () => {
    it('resolves single compound prompt with minimal queries', async () => {
      if (compoundPromptIds.length === 0) {
        console.warn('Skipping test: no compound prompts in database')
        return
      }

      const result = await bulkResolvePrompts([compoundPromptIds[0]])

      // Single compound prompt should require 1-3 queries max
      // (1 for the prompt itself, 1-2 for nested components if needed)
      // Note: Nested compound prompts require 3 queries (one per level)
      expect(result.queriesExecuted).toBeLessThanOrEqual(3)
      expect(result.queriesExecuted).toBeGreaterThanOrEqual(1)
    })

    it('bulk resolution uses fewer queries than individual resolution', async () => {
      if (compoundPromptIds.length < 2) {
        console.warn('Skipping test: need at least 2 compound prompts')
        return
      }

      // Take first 2-3 compound prompts
      const testIds = compoundPromptIds.slice(0, Math.min(3, compoundPromptIds.length))

      // Bulk resolve
      const bulkResult = await bulkResolvePrompts(testIds)

      // Expected: 1-3 queries total (1 for prompts, 1-2 for nested components)
      expect(bulkResult.queriesExecuted).toBeLessThanOrEqual(3)

      // Individual resolution would require N queries minimum
      // Bulk should be significantly better
      const expectedIndividualQueries = testIds.length
      expect(bulkResult.queriesExecuted).toBeLessThan(expectedIndividualQueries)
    })

    it('resolves all test fixtures efficiently', async () => {
      if (testFixtureIds.length === 0) {
        console.warn('Skipping test: no test fixtures in database')
        return
      }

      const result = await bulkResolvePrompts(testFixtureIds)

      // All 6 test fixtures (3 simple + 3 compound) should resolve in 1-3 queries
      // Simple prompts: 1 query
      // Compound level 1: +1 query
      // Nested compound: +1 query
      expect(result.queriesExecuted).toBeLessThanOrEqual(3)
      expect(result.queriesExecuted).toBeGreaterThanOrEqual(1)

      // All fixtures should resolve successfully
      expect(result.successCount).toBe(testFixtureIds.length)
      expect(result.errorCount).toBe(0)
    })

    it('handles mixed simple and compound prompts efficiently', async () => {
      // Get a mix of simple and compound prompts
      const allPrompts = await prisma.prompts.findMany({
        where: {
          status: 'APPROVED',
          deleted_at: null,
        },
        select: {
          id: true,
          is_compound: true,
        },
        take: 20, // Test with 20 prompts (typical browse page size)
      })

      if (allPrompts.length < 10) {
        console.warn('Skipping test: need at least 10 prompts in database')
        return
      }

      const ids = allPrompts.map((p) => p.id)
      const result = await bulkResolvePrompts(ids)

      // 20 prompts should resolve in 1-4 queries regardless of composition
      expect(result.queriesExecuted).toBeLessThanOrEqual(4)

      // Most prompts should resolve successfully
      expect(result.successCount).toBeGreaterThan(0)
    })
  })

  describe('Scalability Tests', () => {
    it('maintains query efficiency with larger batches', async () => {
      // Test with 50 prompts (max pagination size)
      const allPrompts = await prisma.prompts.findMany({
        where: {
          status: 'APPROVED',
          deleted_at: null,
        },
        select: {
          id: true,
        },
        take: 50,
      })

      if (allPrompts.length < 30) {
        console.warn('Skipping test: need at least 30 prompts in database')
        return
      }

      const ids = allPrompts.map((p) => p.id)
      const result = await bulkResolvePrompts(ids)

      // Even with 50 prompts, should stay under 5 queries
      // (1 initial fetch + max 3-4 levels of nesting)
      expect(result.queriesExecuted).toBeLessThanOrEqual(5)
      expect(result.queriesExecuted).toBeGreaterThanOrEqual(1)

      // Should not have O(N) queries
      const worstCaseIndividualQueries = ids.length
      expect(result.queriesExecuted).toBeLessThan(worstCaseIndividualQueries / 10)
    })

    it('query count does not scale linearly with prompt count', async () => {
      // Fetch different batch sizes
      const sizes = [5, 10, 20]
      const queryCountsBySize: number[] = []

      for (const size of sizes) {
        const prompts = await prisma.prompts.findMany({
          where: {
            status: 'APPROVED',
            deleted_at: null,
          },
          select: { id: true },
          take: size,
        })

        if (prompts.length < size) {
          console.warn(`Skipping batch size ${size}: insufficient prompts`)
          continue
        }

        const ids = prompts.map((p) => p.id)
        const result = await bulkResolvePrompts(ids)
        queryCountsBySize.push(result.queriesExecuted)
      }

      if (queryCountsBySize.length < 2) {
        console.warn('Skipping test: insufficient prompts for multiple batch sizes')
        return
      }

      // Query count should be roughly constant or sub-linear
      // (not growing proportionally with batch size)
      const minQueries = Math.min(...queryCountsBySize)
      const maxQueries = Math.max(...queryCountsBySize)

      // Max should not be more than 2x min (showing sub-linear growth)
      expect(maxQueries).toBeLessThanOrEqual(minQueries * 2)
    })
  })

  describe('Resolution Correctness Under Load', () => {
    it('resolves nested compound prompts correctly in bulk', async () => {
      // Find the nested compound test fixture
      const nestedPrompt = await prisma.prompts.findUnique({
        where: { slug: 'test-fixture-nested-compound' },
        select: { id: true },
      })

      if (!nestedPrompt) {
        console.warn('Skipping test: nested compound fixture not found')
        return
      }

      const result = await bulkResolvePrompts([nestedPrompt.id])

      expect(result.successCount).toBe(1)
      expect(result.errorCount).toBe(0)

      const resolvedText = result.resolvedTexts.get(nestedPrompt.id)
      expect(resolvedText).toBeTruthy()
      expect(resolvedText).toContain('Hello! I am a helpful AI assistant.')
      expect(resolvedText).toContain('I specialize in helping with software development tasks.')
      expect(resolvedText).toContain('How can I help you today?')
    })

    it('resolves custom text compound correctly', async () => {
      const customTextPrompt = await prisma.prompts.findUnique({
        where: { slug: 'test-fixture-custom-text-compound' },
        select: { id: true },
      })

      if (!customTextPrompt) {
        console.warn('Skipping test: custom text fixture not found')
        return
      }

      const result = await bulkResolvePrompts([customTextPrompt.id])

      expect(result.successCount).toBe(1)
      const resolvedText = result.resolvedTexts.get(customTextPrompt.id)

      expect(resolvedText).toBeTruthy()
      expect(resolvedText).toContain('START:')
      expect(resolvedText).toContain('Before greeting.')
      expect(resolvedText).toContain('Hello! I am a helpful AI assistant.')
      expect(resolvedText).toContain('After greeting.')
      expect(resolvedText).toContain(':END')
    })
  })

  describe('Performance Comparison', () => {
    it('resolveSinglePrompt helper is efficient', async () => {
      if (compoundPromptIds.length === 0) {
        console.warn('Skipping test: no compound prompts in database')
        return
      }

      const startTime = Date.now()
      const resolvedText = await resolveSinglePrompt(compoundPromptIds[0])
      const endTime = Date.now()

      expect(resolvedText).toBeTruthy()
      expect(resolvedText.length).toBeGreaterThan(0)

      // Single resolution should complete quickly (under 1 second)
      const duration = endTime - startTime
      expect(duration).toBeLessThan(1000)
    })

    it('bulk resolution of 20 prompts completes quickly', async () => {
      const prompts = await prisma.prompts.findMany({
        where: {
          status: 'APPROVED',
          deleted_at: null,
        },
        select: { id: true },
        take: 20,
      })

      if (prompts.length < 10) {
        console.warn('Skipping test: need at least 10 prompts')
        return
      }

      const ids = prompts.map((p) => p.id)
      const startTime = Date.now()
      const result = await bulkResolvePrompts(ids)
      const endTime = Date.now()

      expect(result.successCount).toBeGreaterThan(0)

      // Bulk resolution of 20 prompts should complete in under 2 seconds
      const duration = endTime - startTime
      expect(duration).toBeLessThan(2000)
    })
  })
})
