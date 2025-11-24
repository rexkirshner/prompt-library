'use client'

/**
 * Custom Error Page
 *
 * Error boundary that catches errors in the application.
 * Provides recovery options and error reporting capability.
 */

import { useEffect } from 'react'
import Link from 'next/link'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console in development
    console.error('Application error:', error)

    // In production, you could send to error tracking service here
    // e.g., Sentry, LogRocket, etc.
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-2xl px-4 text-center">
        {/* Error illustration */}
        <div className="mb-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-12 w-12 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Error message */}
        <h2 className="mb-4 text-3xl font-bold text-gray-900">
          Something went wrong
        </h2>
        <p className="mb-8 text-lg text-gray-600">
          We encountered an unexpected error. Please try again or return to the homepage.
        </p>

        {/* Error details (only show in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-left">
            <h3 className="mb-2 text-sm font-semibold text-red-900">
              Error Details (Development Only):
            </h3>
            <pre className="overflow-auto text-xs text-red-800">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 text-xs text-red-700">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Additional help */}
        <div className="mt-12 text-sm text-gray-500">
          <p>If this problem persists, please try:</p>
          <ul className="mt-4 space-y-2">
            <li>Refreshing the page</li>
            <li>Clearing your browser cache</li>
            <li>Checking your internet connection</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
