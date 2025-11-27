/**
 * URL Utilities
 *
 * Helper functions for URL validation and generation that work across multiple domains.
 */

/**
 * Allowed URL schemes for safe external links
 * Only http and https are permitted to prevent XSS attacks
 *
 * @example
 * - ✅ http://example.com
 * - ✅ https://example.com
 * - ❌ javascript:alert(1)
 * - ❌ data:text/html,<script>alert(1)</script>
 * - ❌ file:///etc/passwd
 */
export const ALLOWED_URL_SCHEMES = ['http:', 'https:'] as const

/**
 * Validates URL format and protocol scheme
 *
 * Only allows http: and https: protocols to prevent XSS vulnerabilities.
 * This prevents malicious URLs with dangerous protocols like:
 * - javascript: (executes JavaScript)
 * - data: (can contain embedded scripts)
 * - file: (accesses local filesystem)
 * - vbscript: (executes VBScript)
 *
 * @param url - The URL string to validate
 * @returns true if URL is valid and uses an allowed scheme, false otherwise
 *
 * @example
 * ```typescript
 * isValidUrl('https://example.com') // true
 * isValidUrl('http://example.com/path') // true
 * isValidUrl('javascript:alert(1)') // false - dangerous protocol
 * isValidUrl('not a url') // false - invalid format
 * isValidUrl('') // false - empty string
 * ```
 *
 * @security
 * This function is critical for preventing XSS attacks. Any URL that
 * passes this validation will be displayed as clickable links to users.
 * Always use this function when validating user-provided URLs.
 */
export function isValidUrl(url: string): boolean {
  // Reject empty or whitespace-only strings
  if (!url || url.trim().length === 0) {
    return false
  }

  try {
    const parsed = new URL(url.trim())
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol as (typeof ALLOWED_URL_SCHEMES)[number])
  } catch {
    // URL constructor throws if the URL is malformed
    return false
  }
}

/**
 * Get the base URL for the application
 *
 * Supports multiple domains and deployment environments:
 * - Production: Uses NEXT_PUBLIC_BASE_URL environment variable
 * - Vercel: Uses VERCEL_URL environment variable
 * - Development: Uses NEXTAUTH_URL or defaults to localhost:3001
 *
 * This allows the app to work on:
 * - inputatlas.com (primary domain)
 * - prompts.rexkirshner.com (secondary domain)
 * - Any Vercel preview deployments
 * - Local development
 *
 * @returns The base URL without trailing slash
 *
 * @example
 * ```typescript
 * const url = getBaseUrl()
 * // Returns: 'https://inputatlas.com' in production
 * // Returns: 'http://localhost:3001' in development
 * ```
 */
export function getBaseUrl(): string {
  // 1. Explicit base URL (set in production environment variables)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
  }

  // 2. Vercel automatic URL (preview and production deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // 3. NextAuth URL (typically set for local development)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '')
  }

  // 4. Fallback to localhost
  return 'http://localhost:3001'
}
