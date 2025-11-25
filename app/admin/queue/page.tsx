/**
 * Admin Moderation Queue Page
 *
 * Displays all pending prompts awaiting approval/rejection.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/client'
import { ModerationActions } from './ModerationActions'

export const metadata: Metadata = {
  title: 'Moderation Queue - Admin',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

export default async function AdminQueuePage() {
  await requireAdmin()

  // Fetch all pending prompts
  const pendingPrompts = await prisma.prompts.findMany({
    where: {
      status: 'PENDING',
      deleted_at: null,
    },
    include: {
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
    orderBy: {
      created_at: 'asc', // Oldest first (FIFO)
    },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Moderation Queue</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {pendingPrompts.length} {pendingPrompts.length === 1 ? 'prompt' : 'prompts'}{' '}
            awaiting review
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Queue list */}
      {pendingPrompts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Queue is empty</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No prompts are currently awaiting moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="inline-block rounded-md bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-300">
                      PENDING
                    </span>
                    <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {prompt.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{prompt.title}</h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    by {prompt.author_name} •{' '}
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {prompt.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">{prompt.description}</p>
                </div>
              )}

              {/* Prompt text preview */}
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Prompt Text:</h3>
                <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4">
                  <pre className="line-clamp-6 whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
                    {prompt.prompt_text}
                  </pre>
                </div>
              </div>

              {/* Example output */}
              {prompt.example_output && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Example Output:</h3>
                  <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4">
                    <pre className="line-clamp-4 whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300">
                      {prompt.example_output}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tags */}
              {prompt.prompt_tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {prompt.prompt_tags.map(({ tags }) => (
                      <span
                        key={tags.id}
                        className="rounded-md bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300"
                      >
                        {tags.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                {/* Edit button */}
                <Link
                  href={`/admin/prompts/${prompt.id}/edit`}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  Edit Prompt
                </Link>

                {/* Approve/Reject actions */}
                <ModerationActions promptId={prompt.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
