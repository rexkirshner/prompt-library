/**
 * Sitemap Configuration
 *
 * Generates a dynamic sitemap for search engines.
 * Includes all static pages and dynamic prompt pages.
 */

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'
import { getBaseUrl } from '@/lib/utils/url'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'sitemap' })

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
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

  // Dynamic prompt pages
  // Gracefully handle database unavailability during build
  let promptPages: MetadataRoute.Sitemap = []

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

    promptPages = prompts.map((prompt) => ({
      url: `${baseUrl}/prompts/${prompt.slug}`,
      lastModified: prompt.updated_at,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch (_error) {
    // Database unavailable (likely during build) - return static pages only
    logger.warn('Database unavailable, returning static pages only')
  }

  return [...staticPages, ...promptPages]
}
