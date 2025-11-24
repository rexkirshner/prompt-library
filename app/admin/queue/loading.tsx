/**
 * Admin Queue Loading State
 *
 * Displayed while the moderation queue is loading.
 */

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="mb-4 h-10 w-64 animate-pulse rounded-md bg-gray-200" />
          <div className="h-6 w-80 animate-pulse rounded-md bg-gray-200" />
        </div>
        <div className="h-10 w-48 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Queue list */}
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          >
            {/* Header */}
            <div className="mb-4 flex items-start justify-between">
              <div className="flex-1">
                <div className="mb-2 flex gap-3">
                  <div className="h-6 w-20 animate-pulse rounded-md bg-gray-200" />
                  <div className="h-6 w-32 animate-pulse rounded-md bg-gray-200" />
                </div>
                <div className="mb-2 h-8 w-2/3 animate-pulse rounded-md bg-gray-200" />
                <div className="h-5 w-48 animate-pulse rounded-md bg-gray-200" />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <div className="mb-2 h-4 w-full animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded-md bg-gray-200" />
            </div>

            {/* Prompt text preview */}
            <div className="mb-4">
              <div className="mb-2 h-5 w-32 animate-pulse rounded-md bg-gray-200" />
              <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                <div className="mb-2 h-4 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="mb-2 h-4 w-full animate-pulse rounded-md bg-gray-300" />
                <div className="mb-2 h-4 w-5/6 animate-pulse rounded-md bg-gray-300" />
                <div className="h-4 w-2/3 animate-pulse rounded-md bg-gray-300" />
              </div>
            </div>

            {/* Tags */}
            <div className="mb-4">
              <div className="mb-2 h-5 w-16 animate-pulse rounded-md bg-gray-200" />
              <div className="flex gap-2">
                <div className="h-6 w-20 animate-pulse rounded-md bg-gray-200" />
                <div className="h-6 w-24 animate-pulse rounded-md bg-gray-200" />
                <div className="h-6 w-16 animate-pulse rounded-md bg-gray-200" />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
              <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
