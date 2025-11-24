/**
 * Prompt Submission Page
 *
 * Form for submitting new prompts to the library.
 * Authenticated users have pre-filled author info.
 */

import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { SubmitPromptForm } from './SubmitPromptForm'

export const metadata: Metadata = {
  title: 'Submit a Prompt - AI Prompts Library',
  description: 'Share your AI prompt with the community',
}

// Force dynamic rendering - page checks authentication
export const dynamic = 'force-dynamic'

export default async function SubmitPage() {
  const user = await getCurrentUser()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Submit a Prompt
        </h1>
        <p className="mt-2 text-gray-600">
          Share your AI prompt with the community. All submissions are reviewed
          before publication.
        </p>
      </div>

      {/* License notice */}
      <div className="mb-8 rounded-md bg-blue-50 p-4">
        <h2 className="text-sm font-semibold text-blue-900">
          📝 Content License
        </h2>
        <p className="mt-1 text-sm text-blue-800">
          All submissions are released under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900"
          >
            CC0 (Public Domain)
          </a>
          . By submitting, you agree to dedicate your prompt to the public
          domain.
        </p>
      </div>

      {/* Submission form */}
      <SubmitPromptForm defaultAuthorName={user?.name || ''} />
    </div>
  )
}
