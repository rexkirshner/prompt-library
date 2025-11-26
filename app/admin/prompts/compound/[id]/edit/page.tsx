/**
 * Admin Edit Compound Prompt Page
 *
 * Allows admins to edit existing compound prompts.
 */

import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/client'
import { EditCompoundPromptForm } from './EditCompoundPromptForm'

export const metadata: Metadata = {
  title: 'Edit Compound Prompt - Admin',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

interface EditCompoundPromptPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCompoundPromptPage({
  params,
}: EditCompoundPromptPageProps) {
  await requireAdmin()

  const { id } = await params

  // Fetch compound prompt with components and tags
  const prompt = await prisma.prompts.findUnique({
    where: { id },
    include: {
      compound_components: {
        orderBy: { position: 'asc' },
      },
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
  })

  // 404 if prompt not found, deleted, or not a compound prompt
  if (!prompt || prompt.deleted_at || !prompt.is_compound) {
    notFound()
  }

  // Fetch all approved non-deleted prompts for selection (excluding current prompt)
  const availablePrompts = await prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
      id: { not: id },
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

  // Extract tag names for the form
  const tagNames = prompt.prompt_tags.map((pt) => pt.tags.name)

  // Map components to ComponentData format
  const components = prompt.compound_components.map((comp) => ({
    position: comp.position,
    component_prompt_id: comp.component_prompt_id,
    custom_text_before: comp.custom_text_before,
    custom_text_after: comp.custom_text_after,
  }))

  // Determine back link based on prompt status
  const backLink =
    prompt.status === 'PENDING' ? '/admin/queue' : `/prompts/${prompt.slug}`
  const backText =
    prompt.status === 'PENDING' ? '← Back to Queue' : '← Back to Prompt'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Edit Compound Prompt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update compound prompt details and components
          </p>
        </div>
        <Link
          href={backLink}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {backText}
        </Link>
      </div>

      {/* Edit form */}
      <EditCompoundPromptForm
        prompt={{
          id: prompt.id,
          title: prompt.title,
          slug: prompt.slug,
          status: prompt.status,
          category: prompt.category,
          description: prompt.description || '',
          authorName: prompt.author_name,
          tags: tagNames,
          components,
        }}
        availablePrompts={availablePrompts}
      />
    </div>
  )
}
