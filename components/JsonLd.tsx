/**
 * JsonLd Component
 *
 * React component for embedding JSON-LD structured data in pages.
 * Used to add schema.org metadata for improved SEO.
 *
 * @module components/JsonLd
 *
 * @example
 * ```tsx
 * import { JsonLd } from '@/components/JsonLd'
 * import { generateArticleSchema } from '@/lib/seo/json-ld'
 *
 * export default function Page() {
 *   const schema = generateArticleSchema({
 *     title: 'My Article',
 *     // ... other options
 *   })
 *
 *   return (
 *     <>
 *       <JsonLd data={schema} />
 *       <div>Page content</div>
 *     </>
 *   )
 * }
 * ```
 */

/**
 * Props for JsonLd component
 */
interface JsonLdProps {
  /** JSON-LD structured data object */
  data: Record<string, unknown>
}

/**
 * Embeds JSON-LD structured data in a script tag
 *
 * Safely stringifies and embeds schema.org structured data.
 * Search engines parse this to better understand page content.
 *
 * @param props - Component props
 * @returns Script tag with JSON-LD data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
