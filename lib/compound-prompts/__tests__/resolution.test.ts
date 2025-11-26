/**
 * Tests for compound prompts resolution utilities
 *
 * Tests:
 * - Resolving compound prompts to final text
 * - Handling nested compounds
 * - Custom text before/after
 * - Preview functionality
 * - Dependency tracking
 */

import {
  resolveCompoundPrompt,
  resolvePrompt,
  previewComponents,
  getPromptDependencies,
} from '../resolution'
import {
  MaxDepthExceededError,
  InvalidComponentError,
  type CompoundPromptWithComponents,
  type CompoundPromptComponent,
} from '../types'
import { MAX_NESTING_DEPTH } from '../validation'

/**
 * Helper to create mock prompt data for testing
 */
function createMockPrompt(
  id: string,
  isCompound: boolean,
  promptText: string | null = null,
  components: Array<{
    position: number
    componentPromptId: string | null
    customTextBefore: string | null
    customTextAfter: string | null
    componentPrompt?: CompoundPromptWithComponents | null
  }> = []
): CompoundPromptWithComponents {
  return {
    id,
    prompt_text: promptText,
    is_compound: isCompound,
    max_depth: null,
    compound_components: components.map((comp) => ({
      id: `comp-${id}-${comp.position}`,
      compound_prompt_id: id,
      component_prompt_id: comp.componentPromptId,
      position: comp.position,
      custom_text_before: comp.customTextBefore,
      custom_text_after: comp.customTextAfter,
      created_at: new Date(),
      component_prompt: comp.componentPrompt || null,
    })),
  }
}

describe('resolveCompoundPrompt', () => {
  describe('simple prompts', () => {
    it('should resolve a simple (non-compound) prompt', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        return createMockPrompt(id, false, 'This is a simple prompt')
      })

      const result = await resolveCompoundPrompt('simple-1', getPrompt)
      expect(result.resolved_text).toBe('This is a simple prompt')
      expect(result.depth_reached).toBe(0)
      expect(result.used_prompt_ids).toContain('simple-1')
    })

    it('should handle empty prompt text', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        return createMockPrompt(id, false, '')
      })

      const result = await resolveCompoundPrompt('simple-1', getPrompt)
      expect(result.resolved_text).toBe('')
      expect(result.depth_reached).toBe(0)
    })
  })

  describe('compound prompts with simple components', () => {
    it('should resolve a compound prompt with one simple component', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        return createMockPrompt(id, false, 'Simple prompt text')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      expect(result.resolved_text).toBe('Simple prompt text')
      expect(result.depth_reached).toBe(1) // Depth 1 because we recursed into simple-1
      expect(result.used_prompt_ids).toContain('compound-1')
      expect(result.used_prompt_ids).toContain('simple-1')
    })

    it('should resolve a compound prompt with multiple simple components', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: null,
              customTextAfter: null,
            },
            {
              position: 1,
              componentPromptId: 'simple-2',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        if (id === 'simple-1') {
          return createMockPrompt(id, false, 'First prompt')
        }
        if (id === 'simple-2') {
          return createMockPrompt(id, false, 'Second prompt')
        }
        return createMockPrompt(id, false, 'Default text')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      expect(result.resolved_text).toBe('First prompt\n\nSecond prompt')
      expect(result.used_prompt_ids).toContain('simple-1')
      expect(result.used_prompt_ids).toContain('simple-2')
    })
  })

  describe('custom text handling', () => {
    it('should include custom text before component', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: 'Context: ',
              customTextAfter: null,
            },
          ])
        }
        return createMockPrompt(id, false, 'The actual prompt')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      expect(result.resolved_text).toBe('Context: \n\nThe actual prompt')
    })

    it('should include custom text after component', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: null,
              customTextAfter: '\n\nAdditional instructions',
            },
          ])
        }
        return createMockPrompt(id, false, 'The actual prompt')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      expect(result.resolved_text).toBe('The actual prompt\n\n\n\nAdditional instructions')
    })

    it('should include both custom text before and after', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: 'Before: ',
              customTextAfter: ' After',
            },
          ])
        }
        return createMockPrompt(id, false, 'Middle')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      expect(result.resolved_text).toBe('Before: \n\nMiddle\n\n After')
    })

    it('should handle component with only custom text (no component_prompt_id)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: null,
              customTextBefore: 'Just custom text',
              customTextAfter: null,
            },
          ])
        }
        return createMockPrompt(id, false, 'Should not be called')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      expect(result.resolved_text).toBe('Just custom text')
    })
  })

  describe('nested compounds', () => {
    it('should resolve nested compound prompts (depth 2)', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-level-2') {
          return createMockPrompt('compound-level-2', true, null, [
            {
              position: 0,
              componentPromptId: 'compound-level-1',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        if (id === 'compound-level-1') {
          return createMockPrompt('compound-level-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        return createMockPrompt(id, false, 'Base prompt')
      })

      const result = await resolveCompoundPrompt('compound-level-2', getPrompt)
      expect(result.resolved_text).toBe('Base prompt')
      expect(result.depth_reached).toBe(2) // Depth 2: compound-level-2 -> compound-level-1 -> simple-1
      expect(result.used_prompt_ids).toContain('compound-level-2')
      expect(result.used_prompt_ids).toContain('compound-level-1')
      expect(result.used_prompt_ids).toContain('simple-1')
    })

    it('should track maximum depth across multiple branches', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-root') {
          return createMockPrompt('compound-root', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: null,
              customTextAfter: null,
            },
            {
              position: 1,
              componentPromptId: 'compound-deep',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        if (id === 'compound-deep') {
          return createMockPrompt('compound-deep', true, null, [
            {
              position: 0,
              componentPromptId: 'compound-deeper',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        if (id === 'compound-deeper') {
          return createMockPrompt('compound-deeper', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-2',
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        if (id === 'simple-1') {
          return createMockPrompt(id, false, 'Shallow')
        }
        return createMockPrompt(id, false, 'Deep')
      })

      const result = await resolveCompoundPrompt('compound-root', getPrompt)
      expect(result.resolved_text).toBe('Shallow\n\nDeep')
      expect(result.depth_reached).toBe(3) // The deepest branch: compound-root -> compound-deep -> compound-deeper -> simple-2
    })

    it('should correctly combine text from nested compounds with custom text', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-outer') {
          return createMockPrompt('compound-outer', true, null, [
            {
              position: 0,
              componentPromptId: null,
              customTextBefore: 'Outer before',
              customTextAfter: null,
            },
            {
              position: 1,
              componentPromptId: 'compound-inner',
              customTextBefore: null,
              customTextAfter: null,
            },
            {
              position: 2,
              componentPromptId: null,
              customTextBefore: 'Outer after',
              customTextAfter: null,
            },
          ])
        }
        if (id === 'compound-inner') {
          return createMockPrompt('compound-inner', true, null, [
            {
              position: 0,
              componentPromptId: null,
              customTextBefore: 'Inner before',
              customTextAfter: null,
            },
            {
              position: 1,
              componentPromptId: 'simple-1',
              customTextBefore: null,
              customTextAfter: null,
            },
            {
              position: 2,
              componentPromptId: null,
              customTextBefore: 'Inner after',
              customTextAfter: null,
            },
          ])
        }
        return createMockPrompt(id, false, 'Core content')
      })

      const result = await resolveCompoundPrompt('compound-outer', getPrompt)
      expect(result.resolved_text).toContain('Outer before')
      expect(result.resolved_text).toContain('Inner before')
      expect(result.resolved_text).toContain('Core content')
      expect(result.resolved_text).toContain('Inner after')
      expect(result.resolved_text).toContain('Outer after')
    })
  })

  describe('error handling', () => {
    it('should throw InvalidComponentError if prompt not found', async () => {
      const getPrompt = jest.fn(async () => null)

      await expect(resolveCompoundPrompt('nonexistent', getPrompt)).rejects.toThrow(
        InvalidComponentError
      )
    })

    it('should throw MaxDepthExceededError if recursion exceeds limit', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        const level = parseInt(id.split('-')[1])
        if (level <= MAX_NESTING_DEPTH + 2) {
          return createMockPrompt(id, true, null, [
            {
              position: 0,
              componentPromptId: `compound-${level + 1}`,
              customTextBefore: null,
              customTextAfter: null,
            },
          ])
        }
        return createMockPrompt(id, false, 'Base')
      })

      await expect(resolveCompoundPrompt('compound-1', getPrompt)).rejects.toThrow(
        MaxDepthExceededError
      )
    })
  })

  describe('empty content filtering', () => {
    it('should filter out empty parts from final text', async () => {
      const getPrompt = jest.fn(async (id: string) => {
        if (id === 'compound-1') {
          return createMockPrompt('compound-1', true, null, [
            {
              position: 0,
              componentPromptId: 'simple-1',
              customTextBefore: '   ',
              customTextAfter: '   ',
            },
          ])
        }
        return createMockPrompt(id, false, 'Content')
      })

      const result = await resolveCompoundPrompt('compound-1', getPrompt)
      // Empty/whitespace-only parts should be filtered
      expect(result.resolved_text.trim()).toBe('Content')
    })
  })
})

describe('resolvePrompt', () => {
  it('should resolve simple prompts', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      return createMockPrompt(id, false, 'Simple prompt text')
    })

    const text = await resolvePrompt('simple-1', getPrompt)
    expect(text).toBe('Simple prompt text')
  })

  it('should resolve compound prompts', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      if (id === 'compound-1') {
        return createMockPrompt('compound-1', true, null, [
          {
            position: 0,
            componentPromptId: 'simple-1',
            customTextBefore: null,
            customTextAfter: null,
          },
        ])
      }
      return createMockPrompt(id, false, 'Component text')
    })

    const text = await resolvePrompt('compound-1', getPrompt)
    expect(text).toBe('Component text')
  })
})

describe('previewComponents', () => {
  it('should preview components without saving them', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      return createMockPrompt(id, false, `Text for ${id}`)
    })

    const components = [
      {
        position: 0,
        custom_text_before: 'Start: ',
        component_prompt_id: 'simple-1',
        custom_text_after: null,
      },
      {
        position: 1,
        custom_text_before: null,
        component_prompt_id: 'simple-2',
        custom_text_after: ' End',
      },
    ]

    const preview = await previewComponents(components, getPrompt)
    expect(preview).toContain('Start:')
    expect(preview).toContain('Text for simple-1')
    expect(preview).toContain('Text for simple-2')
    expect(preview).toContain('End')
  })

  it('should handle components with only custom text', async () => {
    const getPrompt = jest.fn(async () => {
      return createMockPrompt('id', false, 'Should not be called')
    })

    const components = [
      {
        position: 0,
        custom_text_before: 'Just text',
        component_prompt_id: null,
        custom_text_after: null,
      },
    ]

    const preview = await previewComponents(components, getPrompt)
    expect(preview).toBe('Just text')
    expect(getPrompt).not.toHaveBeenCalled()
  })

  it('should resolve nested compounds in preview', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      if (id === 'compound-1') {
        return createMockPrompt('compound-1', true, null, [
          {
            position: 0,
            componentPromptId: 'simple-1',
            customTextBefore: null,
            customTextAfter: null,
          },
        ])
      }
      return createMockPrompt(id, false, 'Nested content')
    })

    const components = [
      {
        position: 0,
        custom_text_before: null,
        component_prompt_id: 'compound-1',
        custom_text_after: null,
      },
    ]

    const preview = await previewComponents(components, getPrompt)
    expect(preview).toBe('Nested content')
  })
})

describe('getPromptDependencies', () => {
  it('should return all prompt IDs used in resolution for simple prompts', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      return createMockPrompt(id, false, 'Simple prompt')
    })

    const deps = await getPromptDependencies('simple-1', getPrompt)
    expect(deps).toContain('simple-1')
    expect(deps).toHaveLength(1)
  })

  it('should return all prompt IDs for compound with simple components', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      if (id === 'compound-1') {
        return createMockPrompt('compound-1', true, null, [
          {
            position: 0,
            componentPromptId: 'simple-1',
            customTextBefore: null,
            customTextAfter: null,
          },
          {
            position: 1,
            componentPromptId: 'simple-2',
            customTextBefore: null,
            customTextAfter: null,
          },
        ])
      }
      return createMockPrompt(id, false, 'Text')
    })

    const deps = await getPromptDependencies('compound-1', getPrompt)
    expect(deps).toContain('compound-1')
    expect(deps).toContain('simple-1')
    expect(deps).toContain('simple-2')
    expect(deps).toHaveLength(3)
  })

  it('should return all prompt IDs for nested compounds', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      if (id === 'compound-outer') {
        return createMockPrompt('compound-outer', true, null, [
          {
            position: 0,
            componentPromptId: 'compound-inner',
            customTextBefore: null,
            customTextAfter: null,
          },
        ])
      }
      if (id === 'compound-inner') {
        return createMockPrompt('compound-inner', true, null, [
          {
            position: 0,
            componentPromptId: 'simple-1',
            customTextBefore: null,
            customTextAfter: null,
          },
        ])
      }
      return createMockPrompt(id, false, 'Text')
    })

    const deps = await getPromptDependencies('compound-outer', getPrompt)
    expect(deps).toContain('compound-outer')
    expect(deps).toContain('compound-inner')
    expect(deps).toContain('simple-1')
    expect(deps).toHaveLength(3)
  })

  it('should deduplicate prompt IDs if same prompt used multiple times', async () => {
    const getPrompt = jest.fn(async (id: string) => {
      if (id === 'compound-1') {
        return createMockPrompt('compound-1', true, null, [
          {
            position: 0,
            componentPromptId: 'simple-shared',
            customTextBefore: null,
            customTextAfter: null,
          },
          {
            position: 1,
            componentPromptId: 'simple-shared',
            customTextBefore: null,
            customTextAfter: null,
          },
        ])
      }
      return createMockPrompt(id, false, 'Shared text')
    })

    const deps = await getPromptDependencies('compound-1', getPrompt)
    expect(deps).toContain('compound-1')
    expect(deps).toContain('simple-shared')
    expect(deps).toHaveLength(2) // Not 3, because simple-shared is deduplicated
  })
})
