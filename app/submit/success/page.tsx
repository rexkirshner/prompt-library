/**
 * Submission Success Page
 *
 * Shown after a prompt is successfully submitted.
 * Provides next steps and links.
 */

import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Submission Successful - AI Prompt Library',
  description: 'Your prompt has been submitted for review',
}

export default function SubmissionSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Success icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success message */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Submission Successful!
          </h1>
          <p className="mt-2 text-gray-600">
            Thank you for contributing to the AI Prompt Library.
          </p>
        </div>

        {/* Information */}
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            Your prompt has been submitted for review. Our team will review it
            within 72 hours. You'll be able to see it in the library once it's
            approved.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/submit"
            className="block w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            Submit Another Prompt
          </Link>
          <Link
            href="/prompts"
            className="block w-full rounded-md bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-200"
          >
            Browse Prompts
          </Link>
          <Link
            href="/"
            className="block text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
