/**
 * URL Validation Utilities
 *
 * Provides secure URL validation with protocol scheme whitelisting
 * to prevent XSS attacks via malicious URLs (javascript:, data:, etc.)
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
