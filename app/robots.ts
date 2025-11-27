/**
 * Robots.txt Configuration
 *
 * Controls search engine crawler access.
 */

import { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/utils/url'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/auth/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
