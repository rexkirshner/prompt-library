/**
 * Export Button Component
 *
 * Client component for exporting all prompts to JSON format.
 * Handles the export process, file download, and user feedback.
 */

'use client'

import { useState } from 'react'
import { exportPromptsAction } from './actions'

export function ExportButton() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ count: number; timestamp: string } | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await exportPromptsAction()

      if (result.success && result.data) {
        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        const filename = `prompts-backup-${timestamp}.json`

        // Create and download JSON file
        const json = JSON.stringify(result.data, null, 2)
        const blob = new Blob([json], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        // Show success message
        setSuccess({
          count: result.count || 0,
          timestamp: result.data.exported_at,
        })
      } else {
        setError(result.error || 'Failed to export prompts')
      }
    } catch (err) {
      console.error('Export error:', err)
      setError('An unexpected error occurred during export')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Export All Prompts
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Download all prompts as a JSON file for backup or migration purposes.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm text-green-800 dark:text-green-300">
            Successfully exported {success.count} prompt{success.count !== 1 ? 's' : ''}.
            File downloaded to your computer.
          </p>
        </div>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            Export All Prompts
          </>
        )}
      </button>

      <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          What&apos;s included in the export:
        </h3>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>All prompt content (title, text, description, examples)</li>
          <li>Categories and tags</li>
          <li>Author attribution</li>
          <li>Status and metadata</li>
          <li>Creation and approval timestamps</li>
        </ul>
        <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
          The export excludes transient data like view counts and database IDs. Soft-deleted
          prompts are not included.
        </p>
      </div>
    </div>
  )
}
