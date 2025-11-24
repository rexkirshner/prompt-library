/**
 * Prompts Page Loading State
 *
 * Displayed while the prompts listing is loading.
 */

import { FiltersSkeleton, PromptCardGridSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 h-10 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="h-6 w-96 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Search and Filters */}
      <FiltersSkeleton />

      {/* Stats bar */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <div className="h-5 w-32 animate-pulse rounded-md bg-gray-200" />
        <div className="h-10 w-36 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Prompts grid */}
      <PromptCardGridSkeleton count={20} />
    </div>
  )
}
