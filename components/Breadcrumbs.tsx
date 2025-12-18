/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumb trail with JSON-LD structured data for SEO.
 * Shows users where they are in the site hierarchy and helps search engines
 * understand site structure.
 *
 * @module components/Breadcrumbs
 *
 * @example
 * ```tsx
 * import { Breadcrumbs } from '@/components/Breadcrumbs'
 *
 * export default function Page() {
 *   return (
 *     <Breadcrumbs
 *       items={[
 *         { name: 'Home', url: 'https://inputatlas.com' },
 *         { name: 'Browse', url: 'https://inputatlas.com/prompts' },
 *         { name: 'Code Review', url: 'https://inputatlas.com/prompts/code-review' },
 *       ]}
 *     />
 *   )
 * }
 * ```
 */

import Link from 'next/link'
import { JsonLd } from './JsonLd'
import { generateBreadcrumbSchema } from '@/lib/seo/json-ld'

/**
 * Single breadcrumb item
 */
export interface BreadcrumbItem {
  /** Display name of the breadcrumb */
  name: string
  /** Full URL for the breadcrumb (used in structured data) */
  url: string
  /** Optional: href for Next.js Link (defaults to url without domain) */
  href?: string
}

/**
 * Props for Breadcrumbs component
 */
interface BreadcrumbsProps {
  /** Breadcrumb items in order from root to current page */
  items: BreadcrumbItem[]
  /** Optional: className for custom styling */
  className?: string
}

/**
 * Breadcrumbs navigation component
 *
 * Displays breadcrumb trail with proper ARIA labels and structured data.
 * Last item is current page and not clickable.
 *
 * @param props - Component props
 * @returns Breadcrumb navigation with JSON-LD
 */
export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  // Generate JSON-LD structured data for search engines
  const breadcrumbSchema = generateBreadcrumbSchema(items)

  return (
    <>
      {/* Structured data for SEO */}
      <JsonLd data={breadcrumbSchema} />

      {/* Visual breadcrumbs */}
      <nav
        aria-label="Breadcrumb"
        className={`mb-6 text-sm text-gray-600 dark:text-gray-400 ${className}`}
      >
        <ol className="flex items-center gap-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1
            // Use provided href or extract path from URL
            const href = item.href || new URL(item.url).pathname

            return (
              <li key={item.url} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-gray-400 dark:text-gray-600" aria-hidden="true">
                    /
                  </span>
                )}

                {isLast ? (
                  // Current page - not clickable
                  <span
                    className="font-medium text-gray-900 dark:text-gray-100"
                    aria-current="page"
                  >
                    {item.name}
                  </span>
                ) : (
                  // Clickable breadcrumb
                  <Link
                    href={href}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
