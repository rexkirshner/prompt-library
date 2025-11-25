/**
 * Admin Invites Page
 *
 * Manage invite codes - generate new invites and view usage history.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { getAllInvites, getInviteStats } from '@/lib/invites'
import { InviteGenerator } from './InviteGenerator'

export const metadata: Metadata = {
  title: 'Manage Invites - Admin',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

export default async function AdminInvitesPage() {
  await requireAdmin()

  // Fetch invite data
  const [invites, stats] = await Promise.all([getAllInvites(), getInviteStats()])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Manage Invites
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Generate invite links and track usage
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Stats grid */}
      <div className="mb-8 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invites</div>
          <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
            {stats.total}
          </div>
        </div>

        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
          <div className="text-sm font-medium text-green-600 dark:text-green-400">Used</div>
          <div className="mt-2 text-3xl font-bold text-green-900 dark:text-green-100">
            {stats.used}
          </div>
        </div>

        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
          <div className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending</div>
          <div className="mt-2 text-3xl font-bold text-yellow-900 dark:text-yellow-100">
            {stats.unused}
          </div>
        </div>
      </div>

      {/* Invite generator */}
      <div className="mb-8">
        <InviteGenerator />
      </div>

      {/* Invite history */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
          Invite History
        </h2>
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Used By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Used At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {invites.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No invites created yet
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id}>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {invite.creator.name || invite.creator.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(invite.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold leading-5 ${
                          invite.used_by
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                        }`}
                      >
                        {invite.used_by ? 'Used' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {invite.redeemer ? invite.redeemer.name || invite.redeemer.email : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {invite.used_at ? new Date(invite.used_at).toLocaleDateString() : '-'}
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
