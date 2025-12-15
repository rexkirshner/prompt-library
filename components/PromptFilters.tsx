'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PromptFiltersProps {
  categories: string[]
  allTags: Array<{ slug: string; name: string }>
}

export function PromptFilters({ categories, allTags }: PromptFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  // Local state for search input (for debouncing)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

  // Debounce search query updates
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilter('q', searchValue || null)
    }, 300)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const updateFilter = (key: string, value: string | null) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }

      router.push(`/prompts?${params.toString()}`, { scroll: false })
    })
  }

  const currentCategory = searchParams.get('category') || ''
  const currentTags = searchParams.get('tags')?.split(',').filter(Boolean) || []

  const toggleTag = (tagSlug: string) => {
    const tags = [...currentTags]
    const index = tags.indexOf(tagSlug)

    if (index === -1) {
      tags.push(tagSlug)
    } else {
      tags.splice(index, 1)
    }

    updateFilter('tags', tags.length > 0 ? tags.join(',') : null)
  }

  const clearFilters = () => {
    setSearchValue('')
    startTransition(() => {
      router.push('/prompts', { scroll: false })
    })
  }

  const hasActiveFilters =
    searchValue || currentCategory || currentTags.length > 0

  return (
    <div className="mb-8 space-y-4">
      {/* Search input */}
      <div className="relative">
        <input
          type="search"
          placeholder="Search prompts..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          aria-label="Search prompts"
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 pl-10 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-400"
          maxLength={200}
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isPending && (
          <div className="absolute right-3 top-2.5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-500"></div>
          </div>
        )}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category filter */}
        <select
          value={currentCategory}
          onChange={(e) => updateFilter('category', e.target.value || null)}
          aria-label="Filter by category"
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        {/* Tag filter chips */}
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by tags">
          <span className="text-sm text-gray-600 dark:text-gray-400" id="tag-filter-label">Tags:</span>
          {allTags.slice(0, 10).map((tag) => {
            const isActive = currentTags.includes(tag.slug)
            return (
              <button
                key={tag.slug}
                onClick={() => toggleTag(tag.slug)}
                aria-pressed={isActive}
                aria-label={`Filter by ${tag.name}${isActive ? ' (active)' : ''}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {tag.name}
              </button>
            )
          })}
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  )
}
