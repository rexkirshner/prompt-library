/**
 * Prompt Submission Page
 *
 * Form for submitting new prompts to the library.
 * Authenticated users have pre-filled author info.
 */

import { Metadata } from 'next'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { SubmitPromptFormWrapper } from './SubmitPromptFormWrapper'

export const metadata: Metadata = {
  title: 'Submit a Prompt - Input Atlas',
  description: 'Share your AI prompt with the community',
}

// Force dynamic rendering - page checks authentication
export const dynamic = 'force-dynamic'

export default async function SubmitPage() {
  const user = await getCurrentUser()

  // Fetch approved prompts for compound prompt creation
  const availablePrompts = await prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      is_compound: true,
    },
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Submit a Prompt
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Share your AI prompt with the community. All submissions are reviewed
          before publication.
        </p>
      </div>

      {/* License notice */}
      <div className="mb-8 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
        <h2 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          📝 Content License
        </h2>
        <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">
          All submissions are released under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-900 dark:hover:text-blue-100"
          >
            CC0 (Public Domain)
          </a>
          . By submitting, you agree to dedicate your prompt to the public
          domain.
        </p>
      </div>

      {/* Submission form wrapper with type selector */}
      <SubmitPromptFormWrapper
        defaultAuthorName={user?.name || ''}
        availablePrompts={availablePrompts}
      />
    </div>
  )
}
