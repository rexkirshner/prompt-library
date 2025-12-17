/**
 * Prompts List Client Component
 *
 * Client-side wrapper for prompts display with view mode switching.
 * Handles grid vs list view layout changes.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ViewMode, ViewModeToggle } from './ViewModeToggle'
import { CopyButton } from './CopyButton'
import { SortDropdown } from './SortDropdown'

interface Tag {
  id: string
  name: string
  slug: string
}

interface Prompt {
  id: string
  slug: string
  title: string
  prompt_text: string | null
  description: string | null
  category: string
  author_name: string
  copy_count: number
  resolved_text: string // Resolved text for compound prompts
  ai_generated?: boolean // Whether prompt was AI-generated
  prompt_tags: {
    tags: Tag
  }[]
}

interface PromptsListClientProps {
  prompts: Prompt[]
  userId?: string
  sortPreference?: string
}

export function PromptsListClient({ prompts, userId, sortPreference }: PromptsListClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [hideAiGenerated, setHideAiGenerated] = useState(false)

  // Filter prompts based on AI toggle
  const filteredPrompts = hideAiGenerated
    ? prompts.filter((p) => !p.ai_generated)
    : prompts

  if (prompts.length === 0) {
    return null
  }

  return (
    <>
      {/* Sort, AI Filter, and View Mode Toggle */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <SortDropdown userId={userId} initialSortPreference={sortPreference} />
          {/* AI Filter Toggle - only for logged-in users */}
          {userId && (
            <button
              onClick={() => setHideAiGenerated(!hideAiGenerated)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                hideAiGenerated
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
              }`}
              aria-pressed={hideAiGenerated}
              aria-label={hideAiGenerated ? 'Show AI-generated prompts' : 'Hide AI-generated prompts'}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
              </svg>
              {hideAiGenerated ? 'AI Hidden' : 'Hide AI'}
            </button>
          )}
        </div>
        <ViewModeToggle
          defaultMode="grid"
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group relative rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <Link
                href={`/prompts/${prompt.slug}`}
                className="block"
              >
                {/* Category badge and AI indicator */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {prompt.category}
                  </span>
                  {userId && prompt.ai_generated && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                      </svg>
                      AI
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {prompt.title}
                </h2>

                {/* Description or resolved text preview */}
                {(prompt.description || prompt.resolved_text) && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {prompt.description || prompt.resolved_text}
                  </p>
                )}

                {/* Tags */}
                {prompt.prompt_tags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-1">
                    {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                      <span
                        key={tags.id}
                        className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tags.name}
                      </span>
                    ))}
                    {prompt.prompt_tags.length > 3 && (
                      <span className="rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        +{prompt.prompt_tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Author and Stats (author only for logged-in users) */}
                <div className="mb-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                  {userId && <p>by {prompt.author_name}</p>}
                  {userId && (
                    <p className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                        />
                      </svg>
                      {prompt.copy_count}
                    </p>
                  )}
                </div>
              </Link>

              {/* Copy Button */}
              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  text={prompt.resolved_text}
                  label="Copy Prompt"
                  promptId={prompt.id}
                  userId={userId}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                {/* Main content */}
                <Link
                  href={`/prompts/${prompt.slug}`}
                  className="flex-1"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    {/* Category badge */}
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {prompt.category}
                    </span>

                    {/* AI indicator (logged-in users only) */}
                    {userId && prompt.ai_generated && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                        </svg>
                        AI
                      </span>
                    )}

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                      {prompt.title}
                    </h2>
                  </div>

                  {/* Description or resolved text preview */}
                  {(prompt.description || prompt.resolved_text) && (
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {prompt.description || prompt.resolved_text}
                    </p>
                  )}

                  {/* Tags, Author, and Stats */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Tags */}
                    {prompt.prompt_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prompt.prompt_tags.slice(0, 5).map(({ tags }) => (
                          <span
                            key={tags.id}
                            className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tags.name}
                          </span>
                        ))}
                        {prompt.prompt_tags.length > 5 && (
                          <span className="rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            +{prompt.prompt_tags.length - 5} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Author (logged-in users only) */}
                    {userId && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        by {prompt.author_name}
                      </p>
                    )}

                    {/* Copy Count */}
                    {userId && (
                      <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                        <svg
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                          />
                        </svg>
                        {prompt.copy_count} copied
                      </p>
                    )}
                  </div>
                </Link>

                {/* Copy Button and Arrow */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <CopyButton
                      text={prompt.resolved_text}
                      label="Copy"
                      promptId={prompt.id}
                      userId={userId}
                    />
                  </div>
                  <Link href={`/prompts/${prompt.slug}`}>
                    <svg
                      className="h-6 w-6 text-gray-400 transition-colors group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini List View */}
      {viewMode === 'mini' && (
        <div className="space-y-2">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Title and AI indicator (clickable link) */}
              <Link href={`/prompts/${prompt.slug}`} className="flex flex-1 items-center gap-2 truncate">
                <h3 className="truncate font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {prompt.title}
                </h3>
                {userId && prompt.ai_generated && (
                  <span className="inline-flex flex-shrink-0 items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                    </svg>
                    AI
                  </span>
                )}
              </Link>

              {/* Action buttons */}
              <div className="ml-4 flex flex-shrink-0 items-center gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyButton
                    text={prompt.resolved_text}
                    label="Copy"
                    promptId={prompt.id}
                    userId={userId}
                  />
                </div>
                <Link href={`/prompts/${prompt.slug}`}>
                  <svg
                    className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compact Grid View */}
      {viewMode === 'compact' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group relative flex flex-col rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Title and AI indicator */}
              <Link href={`/prompts/${prompt.slug}`} className="mb-3 flex-1">
                <h3 className="line-clamp-2 font-medium text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {prompt.title}
                </h3>
                {userId && prompt.ai_generated && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                    </svg>
                    AI
                  </span>
                )}
              </Link>

              {/* Action buttons */}
              <div className="flex items-center justify-between gap-2">
                <div onClick={(e) => e.stopPropagation()}>
                  <CopyButton
                    text={prompt.resolved_text}
                    label="Copy"
                    promptId={prompt.id}
                    userId={userId}
                  />
                </div>
                <Link href={`/prompts/${prompt.slug}`}>
                  <svg
                    className="h-5 w-5 text-gray-400 transition-colors group-hover:text-blue-600 dark:text-gray-500 dark:group-hover:text-blue-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
