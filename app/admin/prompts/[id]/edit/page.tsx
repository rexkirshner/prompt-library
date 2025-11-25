/**
 * Admin Edit Prompt Page
 *
 * Allows admins to edit existing approved prompts.
 */

import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/client'
import { EditPromptForm } from './EditPromptForm'

export const metadata: Metadata = {
  title: 'Edit Prompt - Admin',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

interface EditPromptPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditPromptPage({ params }: EditPromptPageProps) {
  await requireAdmin()

  const { id } = await params

  // Fetch prompt with tags
  const prompt = await prisma.prompts.findUnique({
    where: { id },
    include: {
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
  })

  // 404 if prompt not found or deleted
  if (!prompt || prompt.deleted_at) {
    notFound()
  }

  // Extract tag names for the form
  const tagNames = prompt.prompt_tags.map((pt) => pt.tags.name)

  // Determine back link based on prompt status
  const backLink = prompt.status === 'PENDING'
    ? '/admin/queue'
    : `/prompts/${prompt.slug}`
  const backText = prompt.status === 'PENDING'
    ? '← Back to Queue'
    : '← Back to Prompt'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Prompt</h1>
          <p className="mt-2 text-gray-600">
            Update prompt details and content
          </p>
        </div>
        <Link
          href={backLink}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
        >
          {backText}
        </Link>
      </div>

      {/* Edit form */}
      <EditPromptForm
        prompt={{
          id: prompt.id,
          title: prompt.title,
          slug: prompt.slug,
          status: prompt.status,
          promptText: prompt.prompt_text,
          category: prompt.category,
          description: prompt.description || '',
          exampleOutput: prompt.example_output || '',
          authorName: prompt.author_name,
          authorUrl: prompt.author_url || '',
          tags: tagNames,
        }}
      />
    </div>
  )
}
