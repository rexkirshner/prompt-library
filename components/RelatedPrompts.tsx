/**
 * Related Prompts Component
 *
 * Server component that displays prompts related to the current prompt
 * based on category similarity and tag overlap.
 *
 * @module components/RelatedPrompts
 */

import Link from 'next/link'
import { getRelatedPromptsForDisplay } from '@/lib/prompts/related'

/**
 * Props for RelatedPrompts component
 */
interface RelatedPromptsProps {
  /** ID of the current prompt to find related prompts for */
  promptId: string
  /** Maximum number of related prompts to display (default: 5) */
  limit?: number
  /** Optional className for custom styling */
  className?: string
}

/**
 * Related Prompts Section
 *
 * Displays a list of prompts related to the current prompt by category and tags.
 * Automatically fetches and sorts prompts by relevance score.
 *
 * This is a server component - all data fetching happens on the server.
 *
 * @param props - Component props
 * @returns JSX element with related prompts or null if none found
 *
 * @example
 * ```tsx
 * // In a server component or page
 * <RelatedPrompts promptId="current-prompt-id" limit={3} />
 * ```
 */
export async function RelatedPrompts({
  promptId,
  limit = 5,
  className = '',
}: RelatedPromptsProps) {
  // Fetch related prompts on the server
  const relatedPrompts = await getRelatedPromptsForDisplay(promptId, limit)

  // Don't render section if no related prompts found
  if (relatedPrompts.length === 0) {
    return null
  }

  return (
    <section className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 ${className}`}>
      <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        Related Prompts
      </h2>
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Explore similar prompts based on category and tags
      </p>

      <div className="space-y-3">
        {relatedPrompts.map((prompt) => (
          <Link
            key={prompt.id}
            href={`/prompts/${prompt.slug}`}
            className="group block rounded-md border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            {/* Title */}
            <h3 className="mb-1 font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              {prompt.title}
            </h3>

            {/* Description */}
            {prompt.description && (
              <p className="mb-2 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                {prompt.description}
              </p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
              {/* Category badge */}
              <span className="inline-flex items-center rounded-md bg-gray-200 dark:bg-gray-700 px-2 py-0.5 font-medium text-gray-700 dark:text-gray-300">
                {prompt.category}
              </span>

              {/* Tags (show first 3) */}
              {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                <span
                  key={tags.id}
                  className="inline-flex items-center rounded-md bg-blue-100 dark:bg-blue-900 px-2 py-0.5 text-blue-700 dark:text-blue-200"
                >
                  {tags.name}
                </span>
              ))}

              {/* More tags indicator */}
              {prompt.prompt_tags.length > 3 && (
                <span className="text-gray-400 dark:text-gray-600">
                  +{prompt.prompt_tags.length - 3} more
                </span>
              )}
            </div>

            {/* Relevance indicators (for debugging - can be removed in production) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 flex gap-2 text-xs text-gray-400 dark:text-gray-600">
                <span>Score: {prompt.relevanceScore.toFixed(1)}</span>
                {prompt.sameCategory && <span>• Same category</span>}
                {prompt.matchingTags > 0 && (
                  <span>• {prompt.matchingTags} matching tags</span>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* View more link */}
      <div className="mt-4 text-center">
        <Link
          href="/prompts"
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Browse all prompts →
        </Link>
      </div>
    </section>
  )
}
