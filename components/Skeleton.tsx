/**
 * Skeleton Loading Components
 *
 * Reusable skeleton components for loading states.
 * Provides visual feedback while content is loading.
 */

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      aria-hidden="true"
    />
  )
}

/**
 * Skeleton for prompt card in grid view
 */
export function PromptCardSkeleton() {
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      {/* Category badge */}
      <Skeleton className="mb-3 h-6 w-24" />

      {/* Title */}
      <Skeleton className="mb-2 h-6 w-3/4" />

      {/* Description */}
      <Skeleton className="mb-4 h-4 w-full" />
      <Skeleton className="mb-4 h-4 w-2/3" />

      {/* Tags */}
      <div className="mb-4 flex gap-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-14" />
      </div>

      {/* Author */}
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/**
 * Grid of skeleton prompt cards
 */
export function PromptCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <PromptCardSkeleton key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for search/filter section
 */
export function FiltersSkeleton() {
  return (
    <div className="mb-8 space-y-4">
      {/* Search input */}
      <Skeleton className="h-10 w-full" />

      {/* Filters row */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  )
}

/**
 * Skeleton for prompt detail page
 */
export function PromptDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Skeleton className="mb-6 h-4 w-32" />

      {/* Header */}
      <div className="mb-8">
        <Skeleton className="mb-4 h-6 w-32" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Prompt text */}
      <div className="mb-8">
        <Skeleton className="mb-3 h-6 w-32" />
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-full" />
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>

      {/* Tags */}
      <div className="mb-8">
        <Skeleton className="mb-3 h-6 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  )
}
