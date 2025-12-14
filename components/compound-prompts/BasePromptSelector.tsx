/**
 * Base Prompt Selector Modal
 *
 * Modal component for selecting base prompts to add as components
 * in a compound prompt. Includes search and filtering capabilities.
 */

'use client'

import { useState, useEffect } from 'react'

export interface BasePromptOption {
  id: string
  slug: string
  title: string
  description: string | null
  category: string
  is_compound: boolean
}

interface BasePromptSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (prompt: BasePromptOption) => void
  excludeIds?: string[]
  availablePrompts: BasePromptOption[]
}

/**
 * Modal for selecting a base prompt to add to a compound prompt
 *
 * Features:
 * - Search by title/description
 * - Filter by category
 * - Highlights compound prompts
 * - Prevents selecting excluded prompts (circular refs)
 */
export function BasePromptSelector({
  isOpen,
  onClose,
  onSelect,
  excludeIds = [],
  availablePrompts,
}: BasePromptSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Use queueMicrotask to avoid synchronous setState in effect warning
      queueMicrotask(() => {
        setSearch('')
        setSelectedCategory('')
      })
    }
  }, [isOpen])

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Filter prompts
  const filteredPrompts = availablePrompts
    .filter((p) => !excludeIds.includes(p.id))
    .filter((p) => {
      const matchesSearch =
        search.trim() === '' ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()))

      const matchesCategory =
        !selectedCategory || p.category === selectedCategory

      return matchesSearch && matchesCategory
    })

  // Get unique categories from available prompts
  const categories = Array.from(
    new Set(availablePrompts.map((p) => p.category))
  ).sort()

  const handleSelect = (prompt: BasePromptOption) => {
    onSelect(prompt)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <div
          className="relative w-full max-w-3xl rounded-lg bg-white shadow-xl dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Select Base Prompt
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search */}
            <div className="mt-4">
              <input
                type="search"
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                autoFocus
              />
            </div>

            {/* Category Filter */}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('')}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Prompt List */}
          <div className="max-h-96 overflow-y-auto px-6 py-4">
            {filteredPrompts.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                {excludeIds.length > 0 && availablePrompts.length === excludeIds.length
                  ? 'No available prompts (all would create circular references)'
                  : 'No prompts found matching your search'}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPrompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => handleSelect(prompt)}
                    className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-500 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-blue-600"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
                            {prompt.title}
                          </h3>
                          {prompt.is_compound && (
                            <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-200">
                              Compound
                            </span>
                          )}
                        </div>
                        {prompt.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {prompt.description}
                          </p>
                        )}
                        <div className="mt-2">
                          <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {prompt.category}
                          </span>
                        </div>
                      </div>
                      <svg
                        className="ml-4 h-5 w-5 flex-shrink-0 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <p>
                {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}{' '}
                available
              </p>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
