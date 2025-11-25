/**
 * Admin Backup Page
 *
 * Manage prompt backups - export and import prompts for disaster recovery.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { ExportButton } from './ExportButton'

export const metadata: Metadata = {
  title: 'Backup & Recovery - Admin',
}

// Force dynamic rendering - page requires authentication
export const dynamic = 'force-dynamic'

export default async function AdminBackupPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Backup &amp; Recovery
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Export and import prompts for backup and disaster recovery
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Warning banner */}
      <div className="mb-8 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Important: Backup Best Practices
            </h3>
            <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
              <ul className="list-disc list-inside space-y-1">
                <li>Store backups in a secure location separate from this application</li>
                <li>Create regular backups before making significant changes</li>
                <li>Test your backups by importing them in a test environment</li>
                <li>Keep multiple backup versions for point-in-time recovery</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Export section */}
      <div className="mb-8">
        <ExportButton />
      </div>

      {/* Import section - placeholder for Phase 2 */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Import Prompts
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Import functionality coming soon
          </p>
        </div>
        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            The import feature is currently under development. Once complete, you&apos;ll be able
            to restore prompts from exported JSON files.
          </p>
        </div>
      </div>
    </div>
  )
}
