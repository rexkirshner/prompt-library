/**
 * Prompt Detail Page
 *
 * Displays full details of a single prompt.
 * Server component for SEO optimization with dynamic metadata.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/client'
import { auth } from '@/lib/auth'
import { getCurrentUser } from '@/lib/auth'
import { CopyButton } from '@/components/CopyButton'
import { CopyPreview } from '@/components/CopyPreview'
import { resolvePrompt } from '@/lib/compound-prompts/resolution'
import type { CompoundPromptWithComponents } from '@/lib/compound-prompts/types'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'prompts/[slug]' })

interface PromptPageProps {
  params: Promise<{
    slug: string
  }>
}

// Force dynamic rendering - page requires database access
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

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: PromptPageProps): Promise<Metadata> {
  const { slug } = await params
  const prompt = await prisma.prompts.findUnique({
    where: { slug },
    include: {
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
  })

  if (!prompt) {
    return {
      title: 'Prompt Not Found',
    }
  }

  // For compound prompts, resolve to get text for description
  let descriptionText = prompt.description
  if (!descriptionText) {
    if (prompt.is_compound) {
      try {
        const resolvedText = await resolvePrompt(prompt.id, getPromptWithComponents)
        descriptionText = resolvedText.substring(0, 160)
      } catch {
        descriptionText = 'Compound prompt'
      }
    } else {
      descriptionText = prompt.prompt_text?.substring(0, 160) || ''
    }
  }

  const tags = prompt.prompt_tags.map((pt) => pt.tags.name)

  return {
    title: prompt.title,
    description: descriptionText,
    keywords: ['AI prompt', prompt.category, ...tags],
    authors: [{ name: prompt.author_name }],
    openGraph: {
      title: prompt.title,
      description: descriptionText,
      type: 'article',
      publishedTime: prompt.created_at.toISOString(),
      modifiedTime: prompt.updated_at.toISOString(),
      authors: [prompt.author_name],
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: prompt.title,
      description: descriptionText,
    },
  }
}

export default async function PromptPage({ params }: PromptPageProps) {
  const { slug } = await params

  // Get current session to pass userId to CopyButton
  const session = await auth()
  const currentUser = await getCurrentUser()
  const isAdmin = currentUser?.isAdmin === true

  // Fetch prompt with tags and components
  const prompt = await prisma.prompts.findUnique({
    where: { slug },
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
  })

  // 404 if prompt not found or not approved
  if (!prompt || prompt.status !== 'APPROVED' || prompt.deleted_at) {
    notFound()
  }

  // Increment view count (fire and forget, don't await)
  // Use warn level since view count is non-critical
  prisma.prompts
    .update({
      where: { id: prompt.id },
      data: { view_count: { increment: 1 } },
    })
    .catch((err) =>
      logger.warn('Failed to increment view count', {
        operation: 'view-count-increment',
        promptId: prompt.id,
        slug: prompt.slug,
        error: (err as Error).message,
      })
    )

  // For compound prompts, resolve the text
  let displayText: string
  if (prompt.is_compound) {
    try {
      displayText = await resolvePrompt(prompt.id, getPromptWithComponents)
    } catch (error) {
      logger.error('Failed to resolve compound prompt', error as Error, {
        promptId: prompt.id,
        slug: prompt.slug,
      })
      displayText = '[Error: Could not resolve compound prompt]'
    }
  } else {
    displayText = prompt.prompt_text || ''
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link and admin controls */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/prompts"
          className="inline-block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          ← Back to all prompts
        </Link>
        {isAdmin && (
          <Link
            href={
              prompt.is_compound
                ? `/admin/prompts/compound/${prompt.id}/edit`
                : `/admin/prompts/${prompt.id}/edit`
            }
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
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
            Edit
          </Link>
        )}
      </div>

      {/* Header */}
      <div className="mb-8">
        {/* Category and AI indicator */}
        <div className="flex items-center gap-2">
          <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {prompt.category}
          </span>
          {currentUser && prompt.ai_generated && (
            <span className="inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-1 text-sm font-medium text-purple-700 dark:bg-purple-900 dark:text-purple-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
              </svg>
              AI Generated
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          {prompt.title}
        </h1>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>by {prompt.author_name}</span>
          {prompt.author_url && (
            <>
              <span>•</span>
              <a
                href={prompt.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Visit website →
              </a>
            </>
          )}
          {currentUser && (
            <>
              <span>•</span>
              <span>{prompt.view_count} views</span>
              <span>•</span>
              <span>{prompt.copy_count} copied</span>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      {prompt.description && (
        <div className="mb-8">
          <p className="text-gray-700 dark:text-gray-300">{prompt.description}</p>
        </div>
      )}

      {/* Prompt text */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {prompt.is_compound ? 'Resolved Prompt' : 'Prompt'}
          </h2>
          <CopyButton
            text={displayText}
            promptId={prompt.id}
            userId={session?.user?.id}
          />
        </div>
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
            {displayText}
          </pre>
        </div>
        {prompt.is_compound && prompt.compound_components.length > 0 && (
          <div className="mt-4">
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                View component structure ({prompt.compound_components.length} components)
              </summary>
              <div className="mt-3 space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                {prompt.compound_components.map((comp, index) => (
                  <div key={comp.id} className="space-y-1 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {index + 1}.
                      </span>{' '}
                      {comp.component_prompt ? (
                        <span className="text-gray-900 dark:text-gray-100">
                          {comp.component_prompt.title}
                          {comp.component_prompt.is_compound && (
                            <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
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
                    {comp.custom_text_before && (
                      <div className="ml-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Before: </span>
                        <span className="italic">&quot;{comp.custom_text_before}&quot;</span>
                      </div>
                    )}
                    {comp.custom_text_after && (
                      <div className="ml-4 text-xs text-gray-600 dark:text-gray-400">
                        <span className="font-medium">After: </span>
                        <span className="italic">&quot;{comp.custom_text_after}&quot;</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Copy Preview */}
      <CopyPreview text={displayText} promptId={prompt.id} userId={session?.user?.id} />

      {/* Tags */}
      {prompt.prompt_tags.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {prompt.prompt_tags.map(({ tags }) => (
              <span
                key={tags.id}
                className="rounded-md bg-blue-100 dark:bg-blue-900 px-3 py-1 text-sm font-medium text-blue-800 dark:text-blue-200"
              >
                {tags.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* License notice */}
      <div className="mt-12 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          This prompt is released under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            CC0 (Public Domain)
          </a>
          . You are free to use it for any purpose without attribution.
        </p>
      </div>

      {/* Call to action */}
      <div className="mt-8 text-center">
        <Link
          href="/submit"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          Submit Your Own Prompt
        </Link>
      </div>
    </div>
  )
}
