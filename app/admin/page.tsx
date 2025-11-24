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
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Content moderation and management</p>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Pending */}
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="text-sm font-medium text-yellow-600">Pending Review</div>
          <div className="mt-2 text-3xl font-bold text-yellow-900">{pendingCount}</div>
          <Link
            href="/admin/queue"
            className="mt-3 inline-block text-sm font-semibold text-yellow-700 hover:text-yellow-800"
          >
            View Queue →
          </Link>
        </div>

        {/* Approved */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="text-sm font-medium text-green-600">Approved</div>
          <div className="mt-2 text-3xl font-bold text-green-900">{approvedCount}</div>
        </div>

        {/* Rejected */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <div className="text-sm font-medium text-red-600">Rejected</div>
          <div className="mt-2 text-3xl font-bold text-red-900">{rejectedCount}</div>
        </div>

        {/* Tags */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="text-sm font-medium text-blue-600">Total Tags</div>
          <div className="mt-2 text-3xl font-bold text-blue-900">{totalTags}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/queue"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold">Moderation Queue</h3>
            <p className="mt-1 text-sm text-gray-600">
              Review pending submissions ({pendingCount})
            </p>
          </Link>

          <Link
            href="/prompts"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold">Browse Prompts</h3>
            <p className="mt-1 text-sm text-gray-600">View all approved prompts</p>
          </Link>

          <Link
            href="/submit"
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md"
          >
            <h3 className="font-semibold">Submit Prompt</h3>
            <p className="mt-1 text-sm text-gray-600">Test the submission form</p>
          </Link>
        </div>
      </div>

      {/* Recent Submissions */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Recent Submissions</h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {recentSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    No submissions yet
                  </td>
                </tr>
              ) : (
                recentSubmissions.map((prompt) => (
                  <tr key={prompt.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {prompt.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{prompt.author_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                          prompt.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : prompt.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {prompt.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
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
