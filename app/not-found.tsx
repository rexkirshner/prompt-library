/**
 * Custom 404 Not Found Page
 *
 * Displayed when a route doesn't exist.
 * Provides helpful navigation options.
 */

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-2xl px-4 text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>

        {/* Error message */}
        <h2 className="mb-4 text-3xl font-bold text-gray-900">
          Page Not Found
        </h2>
        <p className="mb-8 text-lg text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Go to Homepage
          </Link>
          <Link
            href="/prompts"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Browse Prompts
          </Link>
        </div>

        {/* Additional help */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Looking for something specific?</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            <Link href="/prompts" className="text-blue-600 hover:text-blue-800">
              Browse Prompts
            </Link>
            <span>•</span>
            <Link href="/submit" className="text-blue-600 hover:text-blue-800">
              Submit a Prompt
            </Link>
            <span>•</span>
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
