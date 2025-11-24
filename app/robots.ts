/**
 * Robots.txt Configuration
 *
 * Controls search engine crawler access.
 */

import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/auth/'],
      },
    ],
    sitemap: 'https://prompt-library.vercel.app/sitemap.xml',
  }
}
