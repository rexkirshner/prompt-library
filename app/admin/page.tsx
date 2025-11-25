/**
 * Admin Dashboard Page
 *
 * Overview dashboard with stats and quick links.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Admin Dashboard',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requireAdmin()

  // Fetch stats
  const [pendingCount, approvedCount, rejectedCount, totalTags, recentSubmissions] =
    await Promise.all([
      prisma.prompts.count({
        where: { status: 'PENDING', deleted_at: null },
      }),
      prisma.prompts.count({
        where: { status: 'APPROVED', deleted_at: null },
      }),
      prisma.prompts.count({
        where: { status: 'REJECTED' },
      }),
      prisma.tags.count(),
      prisma.prompts.findMany({
        where: { deleted_at: null },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          created_at: true,
          author_name: true,
        },
      }),
    ])

  const totalPrompts = pendingCount + approvedCount

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Content moderation and management</p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending */}
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
          <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Review</div>
          <div className="mt-2 text-3xl font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</div>
          <Link
            href="/admin/queue"
            className="mt-3 inline-block text-sm font-semibold text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200"
          >
            View Queue →
          </Link>
        </div>

        {/* Approved */}
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
          <div className="text-sm font-medium text-green-600 dark:text-green-400">Approved</div>
          <div className="mt-2 text-3xl font-bold text-green-900 dark:text-green-100">{approvedCount}</div>
        </div>

        {/* Rejected */}
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="text-sm font-medium text-red-600 dark:text-red-400">Rejected</div>
          <div className="mt-2 text-3xl font-bold text-red-900 dark:text-red-100">{rejectedCount}</div>
        </div>

        {/* Tags */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
          <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Tags</div>
          <div className="mt-2 text-3xl font-bold text-blue-900 dark:text-blue-100">{totalTags}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/queue"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Moderation Queue</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review pending submissions ({pendingCount})
            </p>
          </Link>

          <Link
            href="/admin/invites"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Manage Invites</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Generate invite links
            </p>
          </Link>

          <Link
            href="/admin/backup"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Backup &amp; Recovery</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Export and import prompts
            </p>
          </Link>

          <Link
            href="/prompts"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Browse Prompts</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">View all approved prompts</p>
          </Link>

          <Link
            href="/submit"
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Submit Prompt</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Test the submission form</p>
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Recent Submissions</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No submissions yet
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((prompt) => (
                  <tr key={prompt.id}>
                    <td className="px-6 py-4 text-sm font-medium">
                      {prompt.status === 'APPROVED' ? (
                        <Link
                          href={`/prompts/${prompt.slug}`}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                        >
                          {prompt.title}
                        </Link>
                      ) : (
                        <span className="text-gray-900 dark:text-gray-100">{prompt.title}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{prompt.author_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                          prompt.status === 'APPROVED'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : prompt.status === 'PENDING'
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}
                      >
                        {prompt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(prompt.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
