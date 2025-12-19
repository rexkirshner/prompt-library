/**
 * Sitemap Configuration
 *
 * Generates a dynamic sitemap for search engines.
 * Uses modular sitemap generators for easy migration to sitemap index.
 *
 * When the site grows beyond 1000-5000 URLs, this can be converted to
 * a sitemap index pointing to separate static and prompts sitemaps.
 */

import { MetadataRoute } from 'next'
import { generateCombinedSitemap } from '@/lib/seo/sitemaps'

/**
 * Main sitemap endpoint
 *
 * Currently returns a combined sitemap of static pages and prompts.
 * Can be easily migrated to sitemap index structure when needed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return generateCombinedSitemap()
}
