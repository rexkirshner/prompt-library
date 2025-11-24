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
import { CopyButton } from '@/components/CopyButton'

interface PromptPageProps {
  params: {
    slug: string
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({
  params,
}: PromptPageProps): Promise<Metadata> {
  const prompt = await prisma.prompts.findUnique({
    where: { slug: params.slug },
  })

  if (!prompt) {
    return {
      title: 'Prompt Not Found - AI Prompts Library',
    }
  }

  return {
    title: `${prompt.title} - AI Prompts Library`,
    description: prompt.description || prompt.prompt_text.substring(0, 160),
  }
}

export default async function PromptPage({ params }: PromptPageProps) {
  // Fetch prompt with tags
  const prompt = await prisma.prompts.findUnique({
    where: { slug: params.slug },
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
        className="mb-6 inline-block text-sm text-blue-600 hover:text-blue-800"
      >
        ← Back to all prompts
      </Link>

      {/* Header */}
      <div className="mb-8">
        {/* Category */}
        <span className="inline-block rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
          {prompt.category}
        </span>

        {/* Title */}
        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          {prompt.title}
        </h1>

        {/* Metadata */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
          <span>by {prompt.author_name}</span>
          {prompt.author_url && (
            <>
              <span>•</span>
              <a
                href={prompt.author_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
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
          <p className="text-gray-700">{prompt.description}</p>
        </div>
      )}

      {/* Prompt text */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Prompt</h2>
          <CopyButton text={prompt.prompt_text} />
        </div>
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-900">
            {prompt.prompt_text}
          </pre>
        </div>
      </div>

      {/* Example output */}
      {prompt.example_output && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Example Output</h2>
          <div className="rounded-lg border border-gray-300 bg-gray-50 p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">
              {prompt.example_output}
            </pre>
          </div>
        </div>
      )}

      {/* Tags */}
      {prompt.prompt_tags.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Tags</h2>
          <div className="flex flex-wrap gap-2">
            {prompt.prompt_tags.map(({ tags }) => (
              <span
                key={tags.id}
                className="rounded-md bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
              >
                {tags.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* License notice */}
      <div className="mt-12 rounded-md border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          This prompt is released under{' '}
          <a
            href="https://creativecommons.org/publicdomain/zero/1.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
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
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Submit Your Own Prompt
        </Link>
      </div>
    </div>
  )
}
