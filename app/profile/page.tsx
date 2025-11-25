/**
 * User Profile Page
 *
 * Allows users to view and update their profile information.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { ChangePasswordForm } from './ChangePasswordForm'

export const metadata: Metadata = {
  title: 'My Profile',
}

// Force dynamic rendering - page requires authentication
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()

  // Redirect to signin if not authenticated
  if (!user) {
    redirect('/auth/signin?redirectTo=/profile')
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          My Profile
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Information */}
      <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Account Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
          </div>
          {user.isAdmin && (
            <div>
              <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
                Admin
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Section */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Change Password
        </h2>
        <ChangePasswordForm />
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  )
}
