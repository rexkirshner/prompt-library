/**
 * Sort Dropdown Component
 *
 * Client component for sorting prompts list.
 */

'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'popular', label: 'Most Popular' },
]

export function SortDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') || 'newest'

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (newSort === 'newest') {
      // Remove sort param for default
      params.delete('sort')
    } else {
      params.set('sort', newSort)
    }

    // Reset to page 1 when changing sort
    params.delete('page')

    router.push(`/prompts?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Sort by:
      </label>
      <select
        id="sort"
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
