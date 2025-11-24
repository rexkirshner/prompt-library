/**
 * Admin Dashboard Loading State
 *
 * Displayed while the admin dashboard is loading.
 */

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 h-10 w-64 animate-pulse rounded-md bg-gray-200" />
        <div className="h-6 w-80 animate-pulse rounded-md bg-gray-200" />
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 h-5 w-32 animate-pulse rounded-md bg-gray-200" />
            <div className="mb-4 h-10 w-20 animate-pulse rounded-md bg-gray-200" />
            <div className="h-5 w-24 animate-pulse rounded-md bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="mb-4 h-8 w-48 animate-pulse rounded-md bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-2 h-6 w-40 animate-pulse rounded-md bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded-md bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <div className="mb-4 h-8 w-56 animate-pulse rounded-md bg-gray-200" />
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="divide-y divide-gray-200">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-6 px-6 py-4">
                <div className="h-4 w-1/3 animate-pulse rounded-md bg-gray-200" />
                <div className="h-4 w-1/4 animate-pulse rounded-md bg-gray-200" />
                <div className="h-4 w-1/6 animate-pulse rounded-md bg-gray-200" />
                <div className="h-4 w-1/6 animate-pulse rounded-md bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
