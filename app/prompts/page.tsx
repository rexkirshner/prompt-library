/**
 * Prompts Listing Page
 *
 * Displays all approved prompts in a browseable list.
 * Server component for SEO optimization.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
  title: 'Browse Prompts - AI Prompts Library',
  description: 'Discover and explore AI prompts shared by the community',
}

// Force dynamic rendering - page requires database access
export const dynamic = 'force-dynamic'

export default async function PromptsPage() {
  // Fetch all approved prompts with their tags
  const prompts = await prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
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
      created_at: 'desc',
    },
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Browse Prompts</h1>
        <p className="mt-2 text-gray-600">
          Discover AI prompts shared by the community
        </p>
      </div>

      {/* Stats bar */}
      <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-4">
        <p className="text-sm text-gray-600">
          {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} available
        </p>
        <Link
          href="/submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Submit a Prompt
        </Link>
      </div>

      {/* Prompts grid */}
      {prompts.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">
            No prompts yet
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Be the first to submit a prompt to the library!
          </p>
          <Link
            href="/submit"
            className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Submit a Prompt
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {prompts.map((prompt) => (
            <Link
              key={prompt.id}
              href={`/prompts/${prompt.slug}`}
              className="group block rounded-lg border border-gray-200 p-6 transition-shadow hover:shadow-lg"
            >
              {/* Category badge */}
              <div className="mb-3">
                <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {prompt.category}
                </span>
              </div>

              {/* Title */}
              <h2 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {prompt.title}
              </h2>

              {/* Description */}
              {prompt.description && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                  {prompt.description}
                </p>
              )}

              {/* Tags */}
              {prompt.prompt_tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-1">
                  {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                    <span
                      key={tags.id}
                      className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {tags.name}
                    </span>
                  ))}
                  {prompt.prompt_tags.length > 3 && (
                    <span className="rounded bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
                      +{prompt.prompt_tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Author */}
              <p className="text-xs text-gray-500">
                by {prompt.author_name}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
