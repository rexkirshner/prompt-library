/**
 * View Mode Toggle Component
 *
 * Allows users to switch between grid and list view.
 * Client component with local state management.
 */

'use client'

import { useState, useEffect } from 'react'

export type ViewMode = 'grid' | 'list' | 'mini' | 'compact'

interface ViewModeToggleProps {
  defaultMode?: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}

export function ViewModeToggle({
  defaultMode = 'grid',
  onViewModeChange,
}: ViewModeToggleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>(defaultMode)

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('prompts-view-mode') as ViewMode | null
    if (saved && (saved === 'grid' || saved === 'list' || saved === 'mini' || saved === 'compact')) {
      // Use queueMicrotask to avoid synchronous setState in effect warning
      queueMicrotask(() => {
        setViewMode(saved)
        onViewModeChange(saved)
      })
    }
  }, [onViewModeChange])

  const handleToggle = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('prompts-view-mode', mode)
    onViewModeChange(mode)
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-white p-1 dark:border-gray-600 dark:bg-gray-800">
      {/* Grid View Button */}
      <button
        type="button"
        onClick={() => handleToggle('grid')}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-gray-900 text-white dark:bg-gray-700'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z"
          />
        </svg>
      </button>

      {/* Compact Grid View Button */}
      <button
        type="button"
        onClick={() => handleToggle('compact')}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'compact'
            ? 'bg-gray-900 text-white dark:bg-gray-700'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-label="Compact grid view"
        aria-pressed={viewMode === 'compact'}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
          />
        </svg>
      </button>

      {/* List View Button */}
      <button
        type="button"
        onClick={() => handleToggle('list')}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-gray-900 text-white dark:bg-gray-700'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
          />
        </svg>
      </button>

      {/* Mini List View Button */}
      <button
        type="button"
        onClick={() => handleToggle('mini')}
        className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === 'mini'
            ? 'bg-gray-900 text-white dark:bg-gray-700'
            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
        }`}
        aria-label="Mini list view"
        aria-pressed={viewMode === 'mini'}
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      </button>
    </div>
  )
}
