/**
 * Sitemap Configuration
 *
 * Generates a dynamic sitemap for search engines.
 * Includes all static pages and dynamic prompt pages.
 */

import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://prompt-library.vercel.app'

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

  const promptPages: MetadataRoute.Sitemap = prompts.map((prompt) => ({
    url: `${baseUrl}/prompts/${prompt.slug}`,
    lastModified: prompt.updated_at,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [...staticPages, ...promptPages]
}
