/**
 * Admin Create Compound Prompt Page
 *
 * Allows admins to create new compound prompts from existing base prompts.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { prisma } from '@/lib/db/client'
import { CreateCompoundPromptForm } from './CreateCompoundPromptForm'

export const metadata: Metadata = {
  title: 'Create Compound Prompt - Admin',
}

// Force dynamic rendering - page requires authentication and database access
export const dynamic = 'force-dynamic'

export default async function CreateCompoundPromptPage() {
  await requireAdmin()

  // Fetch all approved non-deleted prompts for selection
  const prompts = await prisma.prompts.findMany({
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Create Compound Prompt
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Combine multiple prompts with custom text
          </p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          ← Back to Admin
        </Link>
      </div>

      {/* Create form */}
      <CreateCompoundPromptForm availablePrompts={prompts} />
    </div>
  )
}
