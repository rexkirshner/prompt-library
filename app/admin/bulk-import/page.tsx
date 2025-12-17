/**
 * Bulk Import Admin Page
 *
 * Admin page for importing many prompts at once via JSON upload or paste.
 *
 * @module app/admin/bulk-import
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'
import { BulkImportForm } from './BulkImportForm'

export const metadata: Metadata = {
  title: 'Bulk Import Prompts | Admin',
  description: 'Import multiple prompts at once from JSON data',
}

// Force dynamic rendering - page requires authentication
export const dynamic = 'force-dynamic'

export default async function BulkImportPage() {
  await requireAdmin()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
        >
          ← Back to Admin Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Bulk Import Prompts
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Import multiple prompts at once from JSON data. Supports up to 500 prompts per import.
        </p>
      </div>

      {/* JSON Format Documentation */}
      <div className="mb-8 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
        <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">Expected JSON Format</h2>
        <pre className="text-sm text-blue-800 dark:text-blue-200 overflow-x-auto bg-blue-100 dark:bg-blue-900/40 p-4 rounded">
{`{
  "prompts": [
    {
      "title": "Prompt Title (required)",
      "prompt_text": "The actual prompt content (required)",
      "category": "Development (required)",
      "description": "Optional description",
      "tags": ["optional", "tags"],
      "author_name": "Optional (defaults to 'Input Atlas AI')",
      "author_url": "https://optional.url",
      "ai_generated": true,
      "featured": false,
      "slug": "optional-custom-slug"
    }
  ]
}`}
        </pre>
        <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">
          Only <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">title</code>,{' '}
          <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">prompt_text</code>, and{' '}
          <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">category</code> are required.
          All other fields have sensible defaults.
        </p>
      </div>

      {/* Import Form */}
      <BulkImportForm />
    </div>
  )
}
