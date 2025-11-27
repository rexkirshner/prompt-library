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
import { resolvePrompt } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'admin/queue' })

export const metadata: Metadata = {
  title: 'Moderation Queue - Admin',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

/**
 * Helper to fetch prompt with components for resolution
 */
async function getPromptWithComponents(
  id: string
): Promise<CompoundPromptWithComponents | null> {
  const prompt = await prisma.prompts.findUnique({
    where: { id },
    include: {
      compound_components: {
        include: {
          component_prompt: true,
        },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!prompt) return null

  return {
    id: prompt.id,
    prompt_text: prompt.prompt_text,
    is_compound: prompt.is_compound,
    max_depth: prompt.max_depth,
    compound_components: prompt.compound_components.map((comp) => ({
      ...comp,
      component_prompt: comp.component_prompt
        ? {
            id: comp.component_prompt.id,
            prompt_text: comp.component_prompt.prompt_text,
            is_compound: comp.component_prompt.is_compound,
            max_depth: comp.component_prompt.max_depth,
          }
        : null,
    })),
  }
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
      compound_components: {
        include: {
          component_prompt: {
            select: {
              id: true,
              title: true,
              is_compound: true,
            },
          },
        },
        orderBy: { position: 'asc' },
      },
    },
    orderBy: {
      created_at: 'asc', // Oldest first (FIFO)
    },
  })

  // Resolve compound prompts
  const promptsWithText = await Promise.all(
    pendingPrompts.map(async (prompt) => {
      let displayText: string
      if (prompt.is_compound) {
        try {
          displayText = await resolvePrompt(prompt.id, getPromptWithComponents)
        } catch (error) {
          logger.error('Failed to resolve compound prompt', error as Error, {
            promptId: prompt.id,
            title: prompt.title,
          })
          displayText = '[Error: Could not resolve compound prompt]'
        }
      } else {
        displayText = prompt.prompt_text || ''
      }
      return { ...prompt, displayText }
    })
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Moderation Queue</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {promptsWithText.length} {promptsWithText.length === 1 ? 'prompt' : 'prompts'}{' '}
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
      {promptsWithText.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Queue is empty</h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            No prompts are currently awaiting moderation.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {promptsWithText.map((prompt) => (
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
                    {prompt.is_compound && (
                      <span className="inline-block rounded-md bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                        COMPOUND
                      </span>
                    )}
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
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {prompt.is_compound ? 'Resolved Prompt Text:' : 'Prompt Text:'}
                </h3>
                <div className="rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 p-4">
                  <pre className="line-clamp-6 whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
                    {prompt.displayText}
                  </pre>
                </div>
                {prompt.is_compound && prompt.compound_components.length > 0 && (
                  <div className="mt-2">
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                        View component structure ({prompt.compound_components.length} components)
                      </summary>
                      <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                        {prompt.compound_components.map((comp, index) => (
                          <div key={comp.id} className="text-xs">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {index + 1}.
                            </span>{' '}
                            {comp.component_prompt ? (
                              <span className="text-gray-900 dark:text-gray-100">
                                {comp.component_prompt.title}
                                {comp.component_prompt.is_compound && (
                                  <span className="ml-1 text-xs text-blue-600 dark:text-blue-400">
                                    (compound)
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="italic text-gray-500 dark:text-gray-500">
                                Custom text only
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
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
                  href={
                    prompt.is_compound
                      ? `/admin/prompts/compound/${prompt.id}/edit`
                      : `/admin/prompts/${prompt.id}/edit`
                  }
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
