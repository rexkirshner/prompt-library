/**
 * Sitemap Generation Utilities
 *
 * Modular sitemap generators for different content types.
 * Designed for easy migration to sitemap index structure when needed.
 *
 * @module lib/seo/sitemaps
 */

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { getBaseUrl } from '@/lib/utils/url'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'seo:sitemaps' })

/**
 * Sitemap entry with all standard fields
 */
export interface SitemapEntry {
  url: string
  lastModified?: Date
  changeFrequency?:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never'
  priority?: number
}

/**
 * Generate sitemap entries for static pages
 *
 * Includes homepage, browse, submit, and legal pages.
 * These pages have predictable update frequencies.
 *
 * @param baseUrl - Base URL for the site (from getBaseUrl())
 * @returns Array of sitemap entries for static pages
 *
 * @example
 * ```typescript
 * const staticEntries = generateStaticSitemap('https://inputatlas.com')
 * // Returns: [{ url: 'https://inputatlas.com', ... }, ...]
 * ```
 */
export function generateStaticSitemap(baseUrl: string): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/prompts`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}

/**
 * Generate sitemap entries for approved prompts
 *
 * Fetches all approved, non-deleted prompts from database.
 * Uses actual updated_at timestamps for accurate lastModified dates.
 *
 * @param baseUrl - Base URL for the site
 * @returns Promise resolving to array of sitemap entries for prompts
 * @throws Returns empty array if database is unavailable
 *
 * @example
 * ```typescript
 * const promptEntries = await generatePromptsSitemap('https://inputatlas.com')
 * // Returns: [{ url: 'https://inputatlas.com/prompts/slug', ... }, ...]
 * ```
 */
export async function generatePromptsSitemap(
  baseUrl: string
): Promise<MetadataRoute.Sitemap> {
  try {
    const prompts = await prisma.prompts.findMany({
      where: {
        status: 'APPROVED',
        deleted_at: null,
      },
      select: {
        slug: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    })

    logger.info('Generated prompts sitemap', {
      count: prompts.length,
      baseUrl,
    })

    return prompts.map((prompt) => ({
      url: `${baseUrl}/prompts/${prompt.slug}`,
      lastModified: prompt.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (error) {
    // Database unavailable (likely during build) - return empty array
    logger.warn('Database unavailable for prompts sitemap', {
      error: error instanceof Error ? error.message : String(error),
    })
    return []
  }
}

/**
 * Generate complete combined sitemap
 *
 * Combines static pages and dynamic prompts into a single sitemap.
 * This is the current implementation, but can be split into separate
 * sitemaps when the site grows beyond 1000+ URLs.
 *
 * @returns Promise resolving to complete sitemap array
 *
 * @example
 * ```typescript
 * const sitemap = await generateCombinedSitemap()
 * // Returns: [...staticPages, ...promptPages]
 * ```
 */
export async function generateCombinedSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()
  const staticPages = generateStaticSitemap(baseUrl)
  const promptPages = await generatePromptsSitemap(baseUrl)

  logger.info('Generated combined sitemap', {
    staticCount: staticPages.length,
    promptCount: promptPages.length,
    totalCount: staticPages.length + promptPages.length,
  })

  return [...staticPages, ...promptPages]
}

/**
 * Future: Generate sitemap index
 *
 * When the site grows beyond 1000-5000 URLs, use this function to
 * generate a sitemap index pointing to separate static and prompts sitemaps.
 *
 * @param baseUrl - Base URL for the site
 * @returns Sitemap index structure
 *
 * @example
 * ```typescript
 * const index = generateSitemapIndex('https://inputatlas.com')
 * // Returns sitemap index XML structure
 * ```
 */
export function generateSitemapIndex(baseUrl: string) {
  return {
    sitemaps: [
      {
        url: `${baseUrl}/sitemap-static.xml`,
        lastModified: new Date(),
      },
      {
        url: `${baseUrl}/sitemap-prompts.xml`,
        lastModified: new Date(),
      },
    ],
  }
}
