'use client'

/**
 * Bulk Import Form Component
 *
 * Client component for handling JSON upload/paste and displaying import results.
 *
 * @module app/admin/bulk-import/BulkImportForm
 */

import { useState, useRef } from 'react'

interface ImportResult {
  title: string
  slug: string
  success: boolean
  id?: string
  error?: string
  skipped?: boolean
}

interface ImportResponse {
  success: boolean
  total: number
  created: number
  skipped: number
  failed: number
  message: string
  results: ImportResult[]
  error?: string
  details?: string[]
}

export function BulkImportForm() {
  const [jsonText, setJsonText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setJsonText(text)
      setError(null)
      setResult(null)
    } catch (err) {
      setError('Failed to read file: ' + String(err))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jsonText.trim()) {
      setError('Please enter or upload JSON data')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: jsonText,
      })

      const data: ImportResponse = await response.json()

      if (!response.ok) {
        if (data.details) {
          setError(`${data.error}: ${data.details.slice(0, 5).join(', ')}${data.details.length > 5 ? '...' : ''}`)
        } else {
          setError(data.error || 'Import failed')
        }
        return
      }

      setResult(data)
    } catch (err) {
      setError('Network error: ' + String(err))
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    setJsonText('')
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload/Paste Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload JSON File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded-lg file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-700 dark:file:text-blue-300
              hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50
              cursor-pointer"
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
              or paste JSON directly
            </span>
          </div>
        </div>

        {/* Text Area */}
        <div>
          <label htmlFor="json-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            JSON Data
          </label>
          <textarea
            id="json-input"
            rows={15}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"prompts": [{"title": "...", "prompt_text": "...", "category": "..."}]}'
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800 px-4 py-3
              text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500
              focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20
              font-mono text-sm"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading || !jsonText.trim()}
            className="flex-1 rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold
              hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed
              transition-colors"
          >
            {isLoading ? 'Importing...' : 'Import Prompts'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-3
              text-gray-700 dark:text-gray-300 font-semibold
              hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
              transition-colors"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          {/* Summary */}
          <div className={`p-6 ${result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
            <h3 className={`text-lg font-semibold ${result.success ? 'text-green-900 dark:text-green-100' : 'text-yellow-900 dark:text-yellow-100'}`}>
              Import Complete
            </h3>
            <p className={`mt-1 ${result.success ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}`}>
              {result.message}
            </p>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{result.total}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{result.created}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{result.skipped}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{result.failed}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Failed</div>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Detailed Results</h4>
            <div className="space-y-2">
              {result.results.map((item, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg text-sm ${
                    item.success && !item.skipped
                      ? 'bg-green-50 dark:bg-green-900/10'
                      : item.skipped
                        ? 'bg-yellow-50 dark:bg-yellow-900/10'
                        : 'bg-red-50 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        item.success && !item.skipped
                          ? 'bg-green-500'
                          : item.skipped
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                    />
                    <span className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                      {item.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                      {item.slug}
                    </span>
                    {item.success && !item.skipped ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">Created</span>
                    ) : item.skipped ? (
                      <span className="text-yellow-600 dark:text-yellow-400 font-medium">Skipped</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 font-medium" title={item.error}>
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
