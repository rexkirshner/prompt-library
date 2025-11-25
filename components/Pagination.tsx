'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  if (totalPages <= 1) {
    return null
  }

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', page.toString())
    router.push(`/prompts?${params.toString()}`, { scroll: true })
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Calculate page range to show
  const getPageRange = () => {
    const range: number[] = []
    const maxPagesToShow = 7

    if (totalPages <= maxPagesToShow) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        range.push(i)
      }
    } else {
      // Show first, last, current, and nearby pages
      if (currentPage <= 3) {
        // Near start
        for (let i = 1; i <= 5; i++) {
          range.push(i)
        }
        range.push(-1) // Ellipsis
        range.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        // Near end
        range.push(1)
        range.push(-1) // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) {
          range.push(i)
        }
      } else {
        // Middle
        range.push(1)
        range.push(-1) // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          range.push(i)
        }
        range.push(-2) // Ellipsis
        range.push(totalPages)
      }
    }

    return range
  }

  const pageRange = getPageRange()

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      {/* Results info */}
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Showing {startItem} to {endItem} of {totalItems} results
      </p>

      {/* Page controls */}
      <nav className="flex items-center gap-2">
        {/* Previous button */}
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          ← Previous
        </button>

        {/* Page numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageRange.map((page, index) => {
            if (page === -1 || page === -2) {
              // Ellipsis
              return (
                <span key={`ellipsis-${index}`} className="px-2 text-gray-500 dark:text-gray-400">
                  ...
                </span>
              )
            }

            return (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[2.5rem] rounded-md px-3 py-1.5 text-sm font-medium ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </button>
            )
          })}
        </div>

        {/* Next button */}
        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Next →
        </button>
      </nav>
    </div>
  )
}
