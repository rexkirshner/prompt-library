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
import { CopyButton } from '@/components/CopyButton'
import { CopyPreview } from '@/components/CopyPreview'

interface PromptPageProps {
  params: Promise<{
    slug: string
  }>
}

// Force dynamic rendering - page requires database access
export const dynamic = 'force-dynamic'

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

  const description = prompt.description || prompt.prompt_text.substring(0, 160)
  const tags = prompt.prompt_tags.map((pt) => pt.tags.name)

  return {
    title: prompt.title,
    description,
    keywords: ['AI prompt', prompt.category, ...tags],
    authors: [{ name: prompt.author_name }],
    openGraph: {
      title: prompt.title,
      description,
      type: 'article',
      publishedTime: prompt.created_at.toISOString(),
      modifiedTime: prompt.updated_at.toISOString(),
      authors: [prompt.author_name],
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: prompt.title,
      description,
    },
  }
}

export default async function PromptPage({ params }: PromptPageProps) {
  const { slug } = await params

  // Get current session to pass userId to CopyButton
  const session = await auth()

  // Fetch prompt with tags
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

  // 404 if prompt not found or not approved
  if (!prompt || prompt.status !== 'APPROVED' || prompt.deleted_at) {
    notFound()
  }

  // Increment view count (fire and forget, don't await)
  prisma.prompts
    .update({
      where: { id: prompt.id },
      data: { view_count: { increment: 1 } },
    })
    .catch((err) => console.error('Failed to increment view count:', err))

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Back link */}
      <Link
        href="/prompts"
        className="mb-6 inline-block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
      >
        ← Back to all prompts
      </Link>

      {/* Header */}
      <div className="mb-8">
        {/* Category */}
        <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-800 px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {prompt.category}
        </span>

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
          <span>•</span>
          <span>{prompt.view_count} views</span>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Prompt</h2>
          <CopyButton
            text={prompt.prompt_text}
            promptId={prompt.id}
            userId={session?.user?.id}
          />
        </div>
        <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100">
            {prompt.prompt_text}
          </pre>
        </div>
      </div>

      {/* Copy Preview */}
      <CopyPreview text={prompt.prompt_text} promptId={prompt.id} userId={session?.user?.id} />

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
