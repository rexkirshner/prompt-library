/**
 * String manipulation utilities
 */

/**
 * Converts a string to a URL-friendly slug
 * @param text - The text to slugify
 * @returns A URL-safe slug
 * @example
 * slugify("Hello World!") // "hello-world"
 * slugify("Code Review & Best Practices") // "code-review-best-practices"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Truncates text to a specified length and adds ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 * @example
 * truncate("This is a long text", 10) // "This is a..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Capitalizes the first letter of a string
 * @param text - The text to capitalize
 * @returns Text with first letter capitalized
 * @example
 * capitalize("hello world") // "Hello world"
 */
export function capitalize(text: string): string {
  if (!text) return text
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
