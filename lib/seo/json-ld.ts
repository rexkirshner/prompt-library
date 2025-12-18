/**
 * JSON-LD Structured Data Utilities
 *
 * Generates schema.org structured data for improved SEO.
 * All generators return valid JSON-LD objects that can be embedded in pages.
 *
 * @module lib/seo/json-ld
 *
 * @example
 * ```tsx
 * import { generateArticleSchema } from '@/lib/seo/json-ld'
 *
 * const jsonLd = generateArticleSchema({
 *   title: 'My Article',
 *   description: 'Article description',
 *   author: 'John Doe',
 *   datePublished: new Date(),
 *   dateModified: new Date(),
 *   url: 'https://example.com/article',
 *   keywords: ['keyword1', 'keyword2'],
 * })
 * ```
 */

import { getBaseUrl } from '@/lib/utils/url'

/**
 * WebSite schema for homepage
 * Represents the website itself for search engines
 *
 * @param options - Website configuration
 * @returns JSON-LD object for WebSite schema
 *
 * @example
 * ```tsx
 * const schema = generateWebSiteSchema({
 *   name: 'Input Atlas',
 *   description: 'A curated collection of AI prompts',
 *   url: 'https://inputatlas.com',
 * })
 * ```
 */
export function generateWebSiteSchema(options: {
  name: string
  description: string
  url: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${options.url}/prompts?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * Organization schema for site identity
 * Helps search engines understand who owns/operates the site
 *
 * @param options - Organization details
 * @returns JSON-LD object for Organization schema
 *
 * @example
 * ```tsx
 * const schema = generateOrganizationSchema({
 *   name: 'Input Atlas',
 *   url: 'https://inputatlas.com',
 *   logo: 'https://inputatlas.com/logo.png',
 * })
 * ```
 */
export function generateOrganizationSchema(options: {
  name: string
  url: string
  logo?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: options.name,
    url: options.url,
    ...(options.logo && { logo: options.logo }),
  }
}

/**
 * Article schema for individual content pages
 * Used for prompt detail pages to indicate they are standalone articles
 *
 * @param options - Article metadata
 * @returns JSON-LD object for Article schema
 *
 * @example
 * ```tsx
 * const schema = generateArticleSchema({
 *   title: 'Code Review Prompt',
 *   description: 'A prompt for reviewing code',
 *   author: 'Jane Developer',
 *   datePublished: new Date('2024-01-01'),
 *   dateModified: new Date('2024-01-15'),
 *   url: 'https://inputatlas.com/prompts/code-review',
 *   keywords: ['code', 'review', 'programming'],
 * })
 * ```
 */
export function generateArticleSchema(options: {
  title: string
  description: string
  author: string
  datePublished: Date
  dateModified: Date
  url: string
  keywords: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.title,
    description: options.description,
    author: {
      '@type': 'Person',
      name: options.author,
    },
    datePublished: options.datePublished.toISOString(),
    dateModified: options.dateModified.toISOString(),
    url: options.url,
    keywords: options.keywords.join(', '),
    inLanguage: 'en-US',
  }
}

/**
 * CollectionPage schema for browse/listing pages
 * Indicates that a page displays a collection of items
 *
 * @param options - Collection metadata
 * @returns JSON-LD object for CollectionPage schema
 *
 * @example
 * ```tsx
 * const schema = generateCollectionPageSchema({
 *   name: 'AI Prompts',
 *   description: 'Browse all prompts',
 *   url: 'https://inputatlas.com/prompts',
 *   numberOfItems: 150,
 * })
 * ```
 */
export function generateCollectionPageSchema(options: {
  name: string
  description: string
  url: string
  numberOfItems?: number
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: options.name,
    description: options.description,
    url: options.url,
    ...(options.numberOfItems !== undefined && {
      numberOfItems: options.numberOfItems,
    }),
    inLanguage: 'en-US',
  }
}

/**
 * BreadcrumbList schema for navigation hierarchy
 * Helps search engines understand site structure and display breadcrumbs in search results
 *
 * @param items - Breadcrumb items in order from root to current page
 * @returns JSON-LD object for BreadcrumbList schema
 *
 * @example
 * ```tsx
 * const schema = generateBreadcrumbSchema([
 *   { name: 'Home', url: 'https://inputatlas.com' },
 *   { name: 'Browse', url: 'https://inputatlas.com/prompts' },
 *   { name: 'Code Review', url: 'https://inputatlas.com/prompts/code-review' },
 * ])
 * ```
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

/**
 * Get base URL for the application
 * Re-exported for convenience when building URLs for schemas
 */
export { getBaseUrl }
