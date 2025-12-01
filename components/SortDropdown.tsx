/**
 * Sort Dropdown Component
 *
 * Client component for sorting prompts list.
 * Saves sort preference to database for logged-in users.
 */

'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveSortPreference } from '@/lib/users/actions'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'popular', label: 'Most Popular' },
]

interface SortDropdownProps {
  userId?: string
  initialSortPreference?: string
}

export function SortDropdown({ userId, initialSortPreference }: SortDropdownProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasAppliedInitialSort = useRef(false)

  // Use URL param if present, otherwise use saved preference for logged-in users
  const urlSort = searchParams.get('sort')
  const currentSort = urlSort || initialSortPreference || 'newest'

  // On mount, if user is logged in and has a saved preference, apply it
  useEffect(() => {
    if (
      userId &&
      initialSortPreference &&
      initialSortPreference !== 'newest' &&
      !urlSort &&
      !hasAppliedInitialSort.current
    ) {
      hasAppliedInitialSort.current = true
      const params = new URLSearchParams(searchParams.toString())
      params.set('sort', initialSortPreference)
      router.replace(`/prompts?${params.toString()}`)
    }
  }, [userId, initialSortPreference, urlSort, searchParams, router])

  const handleSortChange = async (newSort: string) => {
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

    // Save preference for logged-in users (fire and forget)
    if (userId) {
      saveSortPreference(newSort)
    }
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
