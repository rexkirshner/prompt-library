/**
 * Homepage Loading State
 *
 * Displayed while the homepage is loading.
 */

import { PromptCardGridSkeleton } from '@/components/Skeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section Skeleton */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <div className="mb-4 h-12 w-96 animate-pulse rounded-md bg-gray-200 mx-auto" />
          <div className="mb-8 h-6 w-128 animate-pulse rounded-md bg-gray-200 mx-auto" />
          <div className="flex justify-center gap-4">
            <div className="h-12 w-40 animate-pulse rounded-md bg-gray-200" />
            <div className="h-12 w-40 animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Recent Prompts Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
              <div className="mt-2 h-4 w-64 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
          <PromptCardGridSkeleton count={6} />
        </section>
      </main>
    </div>
  )
}
