/**
 * Google Analytics Component
 *
 * Loads Google Analytics (GA4) tracking script for the application.
 * Only loads when NEXT_PUBLIC_GA_MEASUREMENT_ID is configured.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4
 */

'use client'

import Script from 'next/script'

/**
 * Google Analytics component for GA4 tracking
 *
 * This component loads the Google Analytics script and initializes tracking.
 * It automatically handles:
 * - Loading gtag.js from Google's CDN
 * - Initializing GA4 with your measurement ID
 * - Only loading in production or when explicitly configured
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * import { GoogleAnalytics } from '@/components/GoogleAnalytics'
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <GoogleAnalytics />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * @configuration
 * Set the environment variable:
 * - NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
 *
 * @privacy
 * - Only loads when measurement ID is configured
 * - Respects user's Do Not Track settings (via gtag config)
 * - Consider adding cookie consent banner for GDPR compliance
 */
export function GoogleAnalytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  // Don't load GA if measurement ID is not configured
  if (!measurementId) {
    return null
  }

  return (
    <>
      {/* Load gtag.js from Google's CDN */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />

      {/* Initialize Google Analytics */}
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>
    </>
  )
}
