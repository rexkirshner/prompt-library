/**
 * Tests for Prompt Search and Filtering Module
 */

import {
  buildSearchWhere,
  validateSearchQuery,
  parseTagFilter,
} from '../search'

describe('buildSearchWhere', () => {
  it('should return base where clause with no filters', () => {
    const where = buildSearchWhere({})

    expect(where).toEqual({
      status: 'APPROVED',
      deleted_at: null,
    })
  })

  it('should add search query to OR clause', () => {
    const where = buildSearchWhere({ query: 'test query' })

    expect(where).toHaveProperty('OR')
    expect(where.OR).toHaveLength(3)
    expect(where.OR).toEqual([
      {
        title: {
          contains: 'test query',
          mode: 'insensitive',
        },
      },
      {
        prompt_text: {
          contains: 'test query',
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: 'test query',
          mode: 'insensitive',
        },
      },
    ])
  })

  it('should trim search query whitespace', () => {
    const where = buildSearchWhere({ query: '  test  ' })

    expect(where.OR?.[0]).toEqual({
      title: {
        contains: 'test',
        mode: 'insensitive',
      },
    })
  })

  it('should not add OR clause for empty query', () => {
    const where = buildSearchWhere({ query: '   ' })

    expect(where).not.toHaveProperty('OR')
  })

  it('should add category filter', () => {
    const where = buildSearchWhere({ category: 'Writing & Content' })

    expect(where.category).toBe('Writing & Content')
  })

  it('should trim category whitespace', () => {
    const where = buildSearchWhere({ category: '  Coding  ' })

    expect(where.category).toBe('Coding')
  })

  it('should add tag filter', () => {
    const where = buildSearchWhere({ tags: ['python', 'machine-learning'] })

    expect(where.prompt_tags).toEqual({
      some: {
        tags: {
          slug: {
            in: ['python', 'machine-learning'],
          },
        },
      },
    })
  })

  it('should not add tag filter for empty array', () => {
    const where = buildSearchWhere({ tags: [] })

    expect(where).not.toHaveProperty('prompt_tags')
  })

  it('should combine all filters', () => {
    const where = buildSearchWhere({
      query: 'code review',
      category: 'Coding & Development',
      tags: ['python', 'best-practices'],
    })

    expect(where.OR).toHaveLength(3)
    expect(where.category).toBe('Coding & Development')
    expect(where.prompt_tags).toBeDefined()
  })
})

describe('validateSearchQuery', () => {
  it('should validate normal query', () => {
    const result = validateSearchQuery('code review assistant')

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should validate empty query', () => {
    const result = validateSearchQuery('')

    expect(result.valid).toBe(true)
  })

  it('should reject query over 200 characters', () => {
    const longQuery = 'a'.repeat(201)
    const result = validateSearchQuery(longQuery)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('Search query must be 200 characters or less')
  })

  it('should accept query at 200 characters', () => {
    const query = 'a'.repeat(200)
    const result = validateSearchQuery(query)

    expect(result.valid).toBe(true)
  })
})

describe('parseTagFilter', () => {
  it('should parse single tag string', () => {
    const tags = parseTagFilter('python')

    expect(tags).toEqual(['python'])
  })

  it('should parse comma-separated tags', () => {
    const tags = parseTagFilter('python,javascript,typescript')

    expect(tags).toEqual(['python', 'javascript', 'typescript'])
  })

  it('should handle array input', () => {
    const tags = parseTagFilter(['python', 'javascript'])

    expect(tags).toEqual(['python', 'javascript'])
  })

  it('should return empty array for undefined', () => {
    const tags = parseTagFilter(undefined)

    expect(tags).toEqual([])
  })

  it('should filter empty strings', () => {
    const tags = parseTagFilter('python,,javascript,')

    expect(tags).toEqual(['python', 'javascript'])
  })
})
