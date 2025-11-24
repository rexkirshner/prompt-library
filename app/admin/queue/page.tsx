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
          <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
          <p className="mt-2 text-gray-600">
            {pendingPrompts.length} {pendingPrompts.length === 1 ? 'prompt' : 'prompts'}{' '}
            awaiting review
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Queue list */}
      {pendingPrompts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Queue is empty</h3>
          <p className="mt-2 text-sm text-gray-600">
            No prompts are currently awaiting moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {pendingPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              {/* Header */}
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <span className="inline-block rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      PENDING
                    </span>
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {prompt.category}
                    </span>
                  </div>
                  <h2 className="text-xl font-semibold">{prompt.title}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    by {prompt.author_name} •{' '}
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {prompt.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700">{prompt.description}</p>
                </div>
              )}

              {/* Prompt text preview */}
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-semibold">Prompt Text:</h3>
                <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                  <pre className="line-clamp-6 whitespace-pre-wrap font-mono text-sm text-gray-900">
                    {prompt.prompt_text}
                  </pre>
                </div>
              </div>

              {/* Example output */}
              {prompt.example_output && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold">Example Output:</h3>
                  <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
                    <pre className="line-clamp-4 whitespace-pre-wrap font-mono text-sm text-gray-700">
                      {prompt.example_output}
                    </pre>
                  </div>
                </div>
              )}

              {/* Tags */}
              {prompt.prompt_tags.length > 0 && (
                <div className="mb-4">
                  <h3 className="mb-2 text-sm font-semibold">Tags:</h3>
                  <div className="flex flex-wrap gap-2">
                    {prompt.prompt_tags.map(({ tags }) => (
                      <span
                        key={tags.id}
                        className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                      >
                        {tags.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <ModerationActions promptId={prompt.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
