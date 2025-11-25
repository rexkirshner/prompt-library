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

interface Tag {
  id: string
  name: string
  slug: string
}

interface Prompt {
  id: string
  slug: string
  title: string
  prompt_text: string
  description: string | null
  category: string
  author_name: string
  prompt_tags: {
    tags: Tag
  }[]
}

interface PromptsListClientProps {
  prompts: Prompt[]
}

export function PromptsListClient({ prompts }: PromptsListClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')

  if (prompts.length === 0) {
    return null
  }

  return (
    <>
      {/* View Mode Toggle */}
      <div className="mb-6 flex justify-end">
        <ViewModeToggle
          defaultMode="grid"
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group relative rounded-lg border border-gray-200 bg-white p-6 transition-shadow hover:shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <Link
                href={`/prompts/${prompt.slug}`}
                className="block"
              >
                {/* Category badge */}
                <div className="mb-3">
                  <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {prompt.category}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                  {prompt.title}
                </h2>

                {/* Description */}
                {prompt.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {prompt.description}
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

                {/* Author */}
                <p className="mb-4 text-xs text-gray-500 dark:text-gray-500">
                  by {prompt.author_name}
                </p>
              </Link>

              {/* Copy Button */}
              <div onClick={(e) => e.stopPropagation()}>
                <CopyButton
                  text={prompt.prompt_text}
                  label="Copy Prompt"
                  promptId={prompt.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {prompts.map((prompt) => (
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

                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 dark:text-gray-100 dark:group-hover:text-blue-400">
                      {prompt.title}
                    </h2>
                  </div>

                  {/* Description */}
                  {prompt.description && (
                    <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                      {prompt.description}
                    </p>
                  )}

                  {/* Tags and Author */}
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

                    {/* Author */}
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      by {prompt.author_name}
                    </p>
                  </div>
                </Link>

                {/* Copy Button and Arrow */}
                <div className="flex flex-shrink-0 items-center gap-3">
                  <div onClick={(e) => e.stopPropagation()}>
                    <CopyButton
                      text={prompt.prompt_text}
                      label="Copy"
                      promptId={prompt.id}
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
    </>
  )
}
