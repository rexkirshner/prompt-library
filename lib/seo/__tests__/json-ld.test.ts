/**
 * Tests for JSON-LD structured data generators
 *
 * Validates that all schema generators produce valid JSON-LD
 * conforming to schema.org specifications.
 */

import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateArticleSchema,
  generateCollectionPageSchema,
  generateBreadcrumbSchema,
} from '../json-ld'

describe('JSON-LD Schema Generators', () => {
  describe('generateWebSiteSchema', () => {
    it('generates valid WebSite schema', () => {
      const schema = generateWebSiteSchema({
        name: 'Test Site',
        description: 'A test website',
        url: 'https://test.com',
      })

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('WebSite')
      expect(schema.name).toBe('Test Site')
      expect(schema.description).toBe('A test website')
      expect(schema.url).toBe('https://test.com')
      expect(schema.inLanguage).toBe('en-US')
    })

    it('includes SearchAction for site search', () => {
      const schema = generateWebSiteSchema({
        name: 'Test Site',
        description: 'A test website',
        url: 'https://test.com',
      })

      expect(schema.potentialAction).toBeDefined()
      expect(schema.potentialAction['@type']).toBe('SearchAction')
      expect(schema.potentialAction.target.urlTemplate).toBe(
        'https://test.com/prompts?search={search_term_string}'
      )
      expect(schema.potentialAction['query-input']).toBe(
        'required name=search_term_string'
      )
    })
  })

  describe('generateOrganizationSchema', () => {
    it('generates valid Organization schema', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Org',
        url: 'https://test.com',
      })

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Organization')
      expect(schema.name).toBe('Test Org')
      expect(schema.url).toBe('https://test.com')
    })

    it('includes logo when provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Org',
        url: 'https://test.com',
        logo: 'https://test.com/logo.png',
      })

      expect(schema.logo).toBe('https://test.com/logo.png')
    })

    it('omits logo when not provided', () => {
      const schema = generateOrganizationSchema({
        name: 'Test Org',
        url: 'https://test.com',
      })

      expect(schema.logo).toBeUndefined()
    })
  })

  describe('generateArticleSchema', () => {
    const mockDate = new Date('2024-01-01T00:00:00Z')

    it('generates valid Article schema', () => {
      const schema = generateArticleSchema({
        title: 'Test Article',
        description: 'Test description',
        author: 'John Doe',
        datePublished: mockDate,
        dateModified: mockDate,
        url: 'https://test.com/article',
        keywords: ['test', 'article'],
      })

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('Article')
      expect(schema.headline).toBe('Test Article')
      expect(schema.description).toBe('Test description')
      expect(schema.url).toBe('https://test.com/article')
      expect(schema.inLanguage).toBe('en-US')
    })

    it('formats author as Person object', () => {
      const schema = generateArticleSchema({
        title: 'Test Article',
        description: 'Test description',
        author: 'John Doe',
        datePublished: mockDate,
        dateModified: mockDate,
        url: 'https://test.com/article',
        keywords: ['test'],
      })

      expect(schema.author).toEqual({
        '@type': 'Person',
        name: 'John Doe',
      })
    })

    it('formats dates as ISO strings', () => {
      const schema = generateArticleSchema({
        title: 'Test Article',
        description: 'Test description',
        author: 'John Doe',
        datePublished: mockDate,
        dateModified: mockDate,
        url: 'https://test.com/article',
        keywords: ['test'],
      })

      expect(schema.datePublished).toBe('2024-01-01T00:00:00.000Z')
      expect(schema.dateModified).toBe('2024-01-01T00:00:00.000Z')
    })

    it('joins keywords with commas', () => {
      const schema = generateArticleSchema({
        title: 'Test Article',
        description: 'Test description',
        author: 'John Doe',
        datePublished: mockDate,
        dateModified: mockDate,
        url: 'https://test.com/article',
        keywords: ['test', 'article', 'seo'],
      })

      expect(schema.keywords).toBe('test, article, seo')
    })

    it('handles empty keywords array', () => {
      const schema = generateArticleSchema({
        title: 'Test Article',
        description: 'Test description',
        author: 'John Doe',
        datePublished: mockDate,
        dateModified: mockDate,
        url: 'https://test.com/article',
        keywords: [],
      })

      expect(schema.keywords).toBe('')
    })
  })

  describe('generateCollectionPageSchema', () => {
    it('generates valid CollectionPage schema', () => {
      const schema = generateCollectionPageSchema({
        name: 'Test Collection',
        description: 'A collection of items',
        url: 'https://test.com/collection',
      })

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('CollectionPage')
      expect(schema.name).toBe('Test Collection')
      expect(schema.description).toBe('A collection of items')
      expect(schema.url).toBe('https://test.com/collection')
      expect(schema.inLanguage).toBe('en-US')
    })

    it('includes numberOfItems when provided', () => {
      const schema = generateCollectionPageSchema({
        name: 'Test Collection',
        description: 'A collection of items',
        url: 'https://test.com/collection',
        numberOfItems: 150,
      })

      expect(schema.numberOfItems).toBe(150)
    })

    it('omits numberOfItems when not provided', () => {
      const schema = generateCollectionPageSchema({
        name: 'Test Collection',
        description: 'A collection of items',
        url: 'https://test.com/collection',
      })

      expect(schema.numberOfItems).toBeUndefined()
    })

    it('includes numberOfItems when zero', () => {
      const schema = generateCollectionPageSchema({
        name: 'Test Collection',
        description: 'A collection of items',
        url: 'https://test.com/collection',
        numberOfItems: 0,
      })

      expect(schema.numberOfItems).toBe(0)
    })
  })

  describe('generateBreadcrumbSchema', () => {
    it('generates valid BreadcrumbList schema', () => {
      const items = [
        { name: 'Home', url: 'https://test.com' },
        { name: 'Category', url: 'https://test.com/category' },
        { name: 'Item', url: 'https://test.com/category/item' },
      ]

      const schema = generateBreadcrumbSchema(items)

      expect(schema['@context']).toBe('https://schema.org')
      expect(schema['@type']).toBe('BreadcrumbList')
      expect(schema.itemListElement).toHaveLength(3)
    })

    it('numbers breadcrumb items starting from 1', () => {
      const items = [
        { name: 'Home', url: 'https://test.com' },
        { name: 'Category', url: 'https://test.com/category' },
      ]

      const schema = generateBreadcrumbSchema(items)

      expect(schema.itemListElement[0].position).toBe(1)
      expect(schema.itemListElement[1].position).toBe(2)
    })

    it('preserves item names and URLs', () => {
      const items = [
        { name: 'Home', url: 'https://test.com' },
        { name: 'Category', url: 'https://test.com/category' },
      ]

      const schema = generateBreadcrumbSchema(items)

      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://test.com',
      })
      expect(schema.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'Category',
        item: 'https://test.com/category',
      })
    })

    it('handles single breadcrumb item', () => {
      const items = [{ name: 'Home', url: 'https://test.com' }]

      const schema = generateBreadcrumbSchema(items)

      expect(schema.itemListElement).toHaveLength(1)
      expect(schema.itemListElement[0].position).toBe(1)
    })

    it('handles empty breadcrumb array', () => {
      const schema = generateBreadcrumbSchema([])

      expect(schema.itemListElement).toHaveLength(0)
    })
  })

  describe('Schema serialization', () => {
    it('generates valid JSON when stringified', () => {
      const schema = generateArticleSchema({
        title: 'Test',
        description: 'Test',
        author: 'Test',
        datePublished: new Date('2024-01-01'),
        dateModified: new Date('2024-01-01'),
        url: 'https://test.com',
        keywords: ['test'],
      })

      const json = JSON.stringify(schema)
      expect(() => JSON.parse(json)).not.toThrow()

      const parsed = JSON.parse(json)
      expect(parsed['@context']).toBe('https://schema.org')
      expect(parsed['@type']).toBe('Article')
    })

    it('does not include undefined values in JSON', () => {
      const schema = generateOrganizationSchema({
        name: 'Test',
        url: 'https://test.com',
      })

      const json = JSON.stringify(schema)
      expect(json).not.toContain('logo')
    })
  })
})
