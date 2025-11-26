/**
 * Tests for compound prompts validation utilities
 *
 * Tests:
 * - Circular reference detection
 * - Maximum depth calculation
 * - Component validation
 * - Component structure validation
 */

import {
  checkCircularReference,
  calculateMaxDepth,
  validateComponent,
  validateComponentStructure,
  MAX_NESTING_DEPTH,
} from '../validation'
import {
  CircularReferenceError,
  MaxDepthExceededError,
  InvalidComponentError,
  type CompoundPromptWithComponents,
  type CompoundPromptComponent,
} from '../types'

/**
 * Helper to create mock prompt data for testing
 */
function createMockPrompt(
  id: string,
  isCompound: boolean,
  components: CompoundPromptComponent[] = []
): CompoundPromptWithComponents {
  return {
    id,
    prompt_text: isCompound ? null : `Mock prompt text for ${id}`,
    is_compound: isCompound,
    max_depth: null,
    compound_components: components.map((comp) => ({
      ...comp,
      component_prompt: null, // Will be set by tests as needed
    })),
  }
}

/**
 * Helper to create mock component data
 */
function createMockComponent(
  id: string,
  compoundPromptId: string,
  componentPromptId: string | null,
  position: number
): CompoundPromptComponent {
  return {
    id,
    compound_prompt_id: compoundPromptId,
    component_prompt_id: componentPromptId,
    position,
    custom_text_before: null,
    custom_text_after: null,
    created_at: new Date(),
  }
}

describe('checkCircularReference', () => {
  describe('basic circular reference detection', () => {
    it('should pass for a simple (non-compound) prompt', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        return createMockPrompt(id, false)
      })

      const result = await checkCircularReference('prompt-1', getPrompt)
      expect(result).toBe(true)
      expect(getPrompt).toHaveBeenCalledTimes(1)
    })

    it('should pass for a compound prompt with simple components', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, [
            createMockComponent('comp-1', 'compound-1', 'simple-1', 0),
            createMockComponent('comp-2', 'compound-1', 'simple-2', 1),
          ])
        }
        return createMockPrompt(id, false)
      })

      const result = await checkCircularReference('compound-1', getPrompt)
      expect(result).toBe(true)
    })

    it('should throw CircularReferenceError for direct self-reference', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, [
            createMockComponent('comp-1', 'compound-1', 'compound-1', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      await expect(checkCircularReference('compound-1', getPrompt)).rejects.toThrow(
        CircularReferenceError
      )
    })

    it('should throw CircularReferenceError for indirect circular reference (A → B → A)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-a') {
          return createMockPrompt('compound-a', true, [
            createMockComponent('comp-1', 'compound-a', 'compound-b', 0),
          ])
        }
        if (id === 'compound-b') {
          return createMockPrompt('compound-b', true, [
            createMockComponent('comp-2', 'compound-b', 'compound-a', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      await expect(checkCircularReference('compound-a', getPrompt)).rejects.toThrow(
        CircularReferenceError
      )
    })

    it('should throw CircularReferenceError for longer circular chain (A → B → C → A)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-a') {
          return createMockPrompt('compound-a', true, [
            createMockComponent('comp-1', 'compound-a', 'compound-b', 0),
          ])
        }
        if (id === 'compound-b') {
          return createMockPrompt('compound-b', true, [
            createMockComponent('comp-2', 'compound-b', 'compound-c', 0),
          ])
        }
        if (id === 'compound-c') {
          return createMockPrompt('compound-c', true, [
            createMockComponent('comp-3', 'compound-c', 'compound-a', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      await expect(checkCircularReference('compound-a', getPrompt)).rejects.toThrow(
        CircularReferenceError
      )
    })
  })

  describe('error handling', () => {
    it('should throw InvalidComponentError if prompt not found', async () => {
      const getPrompt = jest.fn(async () => null)

      await expect(checkCircularReference('nonexistent', getPrompt)).rejects.toThrow(
        InvalidComponentError
      )
    })

    it('should include path in CircularReferenceError', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-a') {
          return createMockPrompt('compound-a', true, [
            createMockComponent('comp-1', 'compound-a', 'compound-b', 0),
          ])
        }
        if (id === 'compound-b') {
          return createMockPrompt('compound-b', true, [
            createMockComponent('comp-2', 'compound-b', 'compound-a', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      try {
        await checkCircularReference('compound-a', getPrompt)
        fail('Should have thrown CircularReferenceError')
      } catch (error) {
        expect(error).toBeInstanceOf(CircularReferenceError)
        if (error instanceof CircularReferenceError) {
          expect(error.path).toContain('compound-a')
          expect(error.path).toContain('compound-b')
        }
      }
    })
  })

  describe('complex scenarios', () => {
    it('should handle diamond dependency (A → B, A → C, B → D, C → D)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-a') {
          return createMockPrompt('compound-a', true, [
            createMockComponent('comp-1', 'compound-a', 'compound-b', 0),
            createMockComponent('comp-2', 'compound-a', 'compound-c', 1),
          ])
        }
        if (id === 'compound-b') {
          return createMockPrompt('compound-b', true, [
            createMockComponent('comp-3', 'compound-b', 'simple-d', 0),
          ])
        }
        if (id === 'compound-c') {
          return createMockPrompt('compound-c', true, [
            createMockComponent('comp-4', 'compound-c', 'simple-d', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      const result = await checkCircularReference('compound-a', getPrompt)
      expect(result).toBe(true)
    })

    it('should skip components with only custom text (no component_prompt_id)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          const comp = createMockComponent('comp-1', 'compound-1', null, 0)
          comp.custom_text_before = 'Some custom text'
          return createMockPrompt('compound-1', true, [comp])
        }
        return createMockPrompt(id, false)
      })

      const result = await checkCircularReference('compound-1', getPrompt)
      expect(result).toBe(true)
    })
  })
})

describe('calculateMaxDepth', () => {
  describe('depth calculation', () => {
    it('should return 0 for simple (non-compound) prompts', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        return createMockPrompt(id, false)
      })

      const depth = await calculateMaxDepth('simple-1', getPrompt)
      expect(depth).toBe(0)
    })

    it('should return 1 for compound with only simple components', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, [
            createMockComponent('comp-1', 'compound-1', 'simple-1', 0),
            createMockComponent('comp-2', 'compound-1', 'simple-2', 1),
          ])
        }
        return createMockPrompt(id, false)
      })

      const depth = await calculateMaxDepth('compound-1', getPrompt)
      expect(depth).toBe(1)
    })

    it('should return 2 for compound with compound components (depth 2)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-level-2') {
          return createMockPrompt('compound-level-2', true, [
            createMockComponent('comp-1', 'compound-level-2', 'compound-level-1', 0),
          ])
        }
        if (id === 'compound-level-1') {
          return createMockPrompt('compound-level-1', true, [
            createMockComponent('comp-2', 'compound-level-1', 'simple-1', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      const depth = await calculateMaxDepth('compound-level-2', getPrompt)
      expect(depth).toBe(2)
    })

    it('should calculate maximum depth across multiple branches', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-root') {
          return createMockPrompt('compound-root', true, [
            createMockComponent('comp-1', 'compound-root', 'simple-1', 0), // depth 0
            createMockComponent('comp-2', 'compound-root', 'compound-deep', 1), // depth 2
          ])
        }
        if (id === 'compound-deep') {
          return createMockPrompt('compound-deep', true, [
            createMockComponent('comp-3', 'compound-deep', 'compound-deeper', 0),
          ])
        }
        if (id === 'compound-deeper') {
          return createMockPrompt('compound-deeper', true, [
            createMockComponent('comp-4', 'compound-deeper', 'simple-2', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      const depth = await calculateMaxDepth('compound-root', getPrompt)
      expect(depth).toBe(3) // 1 + max(0, 2) = 3
    })

    it('should skip components with only custom text', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          const comp = createMockComponent('comp-1', 'compound-1', null, 0)
          comp.custom_text_before = 'Custom text'
          return createMockPrompt('compound-1', true, [comp])
        }
        return createMockPrompt(id, false)
      })

      const depth = await calculateMaxDepth('compound-1', getPrompt)
      expect(depth).toBe(1) // Still has depth 1 because it's a compound
    })
  })

  describe('caching', () => {
    it('should use cache to avoid recalculating depths', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-a') {
          return createMockPrompt('compound-a', true, [
            createMockComponent('comp-1', 'compound-a', 'shared', 0),
            createMockComponent('comp-2', 'compound-a', 'shared', 1),
          ])
        }
        return createMockPrompt(id, false)
      })

      const cache = new Map<string, number>()
      await calculateMaxDepth('compound-a', getPrompt, cache)

      // Should have been called for compound-a and shared (only once for shared)
      expect(getPrompt).toHaveBeenCalledTimes(2)
    })
  })

  describe('error handling', () => {
    it('should throw InvalidComponentError if prompt not found', async () => {
      const getPrompt = jest.fn(async () => null)

      await expect(calculateMaxDepth('nonexistent', getPrompt)).rejects.toThrow(
        InvalidComponentError
      )
    })

    it('should throw MaxDepthExceededError if depth exceeds MAX_NESTING_DEPTH', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        // Create a chain deeper than MAX_NESTING_DEPTH
        const level = parseInt(id.split('-')[1])
        if (level <= MAX_NESTING_DEPTH + 1) {
          return createMockPrompt(id, true, [
            createMockComponent(`comp-${level}`, id, `compound-${level + 1}`, 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      await expect(calculateMaxDepth('compound-1', getPrompt)).rejects.toThrow(
        MaxDepthExceededError
      )
    })

    it('should include depth details in MaxDepthExceededError', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        const level = parseInt(id.split('-')[1])
        if (level <= MAX_NESTING_DEPTH + 1) {
          return createMockPrompt(id, true, [
            createMockComponent(`comp-${level}`, id, `compound-${level + 1}`, 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      try {
        await calculateMaxDepth('compound-1', getPrompt)
        fail('Should have thrown MaxDepthExceededError')
      } catch (error) {
        expect(error).toBeInstanceOf(MaxDepthExceededError)
        if (error instanceof MaxDepthExceededError) {
          expect(error.maxDepth).toBe(MAX_NESTING_DEPTH)
          expect(error.actualDepth).toBeGreaterThan(MAX_NESTING_DEPTH)
        }
      }
    })
  })
})

describe('validateComponent', () => {
  describe('basic validation', () => {
    it('should pass for valid simple component', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        return createMockPrompt(id, false)
      })

      const result = await validateComponent('compound-1', 'simple-1', getPrompt)
      expect(result).toBe(true)
    })

    it('should pass for valid nested compound component', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-2') {
          return createMockPrompt('compound-2', true, [
            createMockComponent('comp-1', 'compound-2', 'simple-1', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      const result = await validateComponent('compound-1', 'compound-2', getPrompt)
      expect(result).toBe(true)
    })
  })

  describe('self-reference validation', () => {
    it('should throw CircularReferenceError for self-reference', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        return createMockPrompt(id, true)
      })

      await expect(validateComponent('compound-1', 'compound-1', getPrompt)).rejects.toThrow(
        CircularReferenceError
      )
    })
  })

  describe('circular reference validation', () => {
    it('should throw if component would create circular reference', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-b') {
          return createMockPrompt('compound-b', true, [
            createMockComponent('comp-1', 'compound-b', 'compound-a', 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      await expect(validateComponent('compound-a', 'compound-b', getPrompt)).rejects.toThrow(
        CircularReferenceError
      )
    })
  })

  describe('depth validation', () => {
    it('should throw if component would exceed max depth', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        // Create a deep component chain
        const level = parseInt(id.split('-')[1] || '0')
        if (level < MAX_NESTING_DEPTH) {
          return createMockPrompt(id, true, [
            createMockComponent(`comp-${level}`, id, `compound-${level + 1}`, 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      await expect(validateComponent('compound-root', 'compound-0', getPrompt)).rejects.toThrow(
        MaxDepthExceededError
      )
    })

    it('should pass if component depth is within limits', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        // Create a component chain just under the limit
        const level = parseInt(id.split('-')[1] || '0')
        if (level < MAX_NESTING_DEPTH - 1) {
          return createMockPrompt(id, true, [
            createMockComponent(`comp-${level}`, id, `compound-${level + 1}`, 0),
          ])
        }
        return createMockPrompt(id, false)
      })

      const result = await validateComponent('compound-root', 'compound-0', getPrompt)
      expect(result).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should throw InvalidComponentError if component not found', async () => {
      const getPrompt = jest.fn(async () => null)

      await expect(validateComponent('compound-1', 'nonexistent', getPrompt)).rejects.toThrow(
        InvalidComponentError
      )
    })
  })
})

describe('validateComponentStructure', () => {
  describe('basic structure validation', () => {
    it('should pass for valid component structure', () => {
      const components: CompoundPromptComponent[] = [
        createMockComponent('comp-1', 'compound-1', 'simple-1', 0),
        createMockComponent('comp-2', 'compound-1', 'simple-2', 1),
      ]

      const result = validateComponentStructure(components)
      expect(result).toBe(true)
    })

    it('should pass for components with custom text', () => {
      const comp = createMockComponent('comp-1', 'compound-1', null, 0)
      comp.custom_text_before = 'Custom text'

      const result = validateComponentStructure([comp])
      expect(result).toBe(true)
    })
  })

  describe('position validation', () => {
    it('should throw if positions are not consecutive', () => {
      const components: CompoundPromptComponent[] = [
        createMockComponent('comp-1', 'compound-1', 'simple-1', 0),
        createMockComponent('comp-2', 'compound-1', 'simple-2', 2), // Skipped position 1
      ]

      expect(() => validateComponentStructure(components)).toThrow(InvalidComponentError)
    })

    it('should throw if positions do not start at 0', () => {
      const components: CompoundPromptComponent[] = [
        createMockComponent('comp-1', 'compound-1', 'simple-1', 1),
        createMockComponent('comp-2', 'compound-1', 'simple-2', 2),
      ]

      expect(() => validateComponentStructure(components)).toThrow(InvalidComponentError)
    })

    it('should handle single component at position 0', () => {
      const components: CompoundPromptComponent[] = [
        createMockComponent('comp-1', 'compound-1', 'simple-1', 0),
      ]

      const result = validateComponentStructure(components)
      expect(result).toBe(true)
    })
  })

  describe('content validation', () => {
    it('should throw if component has neither prompt nor custom text', () => {
      const comp = createMockComponent('comp-1', 'compound-1', null, 0)

      expect(() => validateComponentStructure([comp])).toThrow(InvalidComponentError)
    })

    it('should throw if components array is empty', () => {
      expect(() => validateComponentStructure([])).toThrow(InvalidComponentError)
    })
  })
})
