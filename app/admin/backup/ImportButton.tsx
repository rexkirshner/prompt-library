/**
 * Import Button Component
 *
 * Client component for importing prompts from JSON backup files.
 * Handles file upload, validation preview, and import execution with user feedback.
 */

'use client'

import { useState, useRef } from 'react'
import { validateImportAction, importPromptsAction } from './actions'
import type { ImportResult } from '@/lib/import-export'

type DuplicateStrategy = 'skip' | 'update' | 'error'

interface ValidationPreview {
  result: ImportResult
  fileContent: string
}

export function ImportButton() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationPreview, setValidationPreview] = useState<ValidationPreview | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [duplicateStrategy, setDuplicateStrategy] = useState<DuplicateStrategy>('skip')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setError('Please select a valid JSON file')
      return
    }

    setIsProcessing(true)
    setError(null)
    setValidationPreview(null)
    setImportResult(null)

    try {
      // Read file content
      const fileContent = await file.text()

      // Validate the import data
      const result = await validateImportAction(fileContent, {
        onDuplicate: duplicateStrategy,
      })

      if (!result.success && result.total === 0) {
        // Critical error - invalid JSON or structure
        setError(result.errors[0]?.message || 'Invalid import file')
      } else {
        // Show validation preview (may have warnings or errors)
        setValidationPreview({ result, fileContent })
      }
    } catch (err) {
      console.error('File read error:', err)
      setError('Failed to read file. Please ensure it is a valid JSON file.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleImport = async () => {
    if (!validationPreview) return

    setIsProcessing(true)
    setError(null)
    setImportResult(null)

    try {
      const result = await importPromptsAction(validationPreview.fileContent, {
        onDuplicate: duplicateStrategy,
      })

      setImportResult(result)
      setValidationPreview(null)

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('Import error:', err)
      setError('An unexpected error occurred during import')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancel = () => {
    setValidationPreview(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleNewImport = () => {
    setImportResult(null)
    setError(null)
    setValidationPreview(null)
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Import Prompts
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Upload a JSON backup file to restore prompts to the database.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Import success result */}
      {importResult && (
        <div className="mb-4 space-y-4">
          {importResult.success ? (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-400 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-300">
                    Import completed successfully!
                  </p>
                  <div className="mt-2 text-sm text-green-700 dark:text-green-400">
                    <p>
                      <strong>{importResult.imported}</strong> prompt
                      {importResult.imported !== 1 ? 's' : ''} imported
                    </p>
                    {importResult.skipped > 0 && (
                      <p>
                        <strong>{importResult.skipped}</strong> duplicate
                        {importResult.skipped !== 1 ? 's' : ''} skipped
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {importResult.warnings && importResult.warnings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
                  <p className="text-xs font-medium text-green-900 dark:text-green-200 mb-2">
                    Warnings ({importResult.warnings.length}):
                  </p>
                  <ul className="text-xs text-green-800 dark:text-green-300 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.warnings.map((warning, idx) => (
                      <li key={idx} className="break-words">
                        {warning.slug ? `${warning.slug}: ${warning.message}` : warning.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-400 mt-0.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300">
                    Import failed
                  </p>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                    <p>
                      <strong>{importResult.failed}</strong> error
                      {importResult.failed !== 1 ? 's' : ''} occurred
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {importResult.errors && importResult.errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-700">
                  <p className="text-xs font-medium text-red-900 dark:text-red-200 mb-2">
                    Errors:
                  </p>
                  <ul className="text-xs text-red-800 dark:text-red-300 space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="break-words">
                        {error.slug ? `${error.slug}: ${error.message}` : error.message}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-red-600 dark:text-red-400 italic">
                        ... and {importResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleNewImport}
            className="w-full rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Import Another File
          </button>
        </div>
      )}

      {/* Validation preview */}
      {validationPreview && !importResult && (
        <div className="mb-4 space-y-4">
          <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
              Import Preview
            </h3>
            <div className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
              <div className="flex justify-between">
                <span>Total prompts in file:</span>
                <strong>{validationPreview.result.total}</strong>
              </div>
              <div className="flex justify-between">
                <span>Will be imported:</span>
                <strong className="text-green-600 dark:text-green-400">
                  {validationPreview.result.imported}
                </strong>
              </div>
              {validationPreview.result.skipped > 0 && (
                <div className="flex justify-between">
                  <span>Duplicates (will skip):</span>
                  <strong className="text-yellow-600 dark:text-yellow-400">
                    {validationPreview.result.skipped}
                  </strong>
                </div>
              )}
              {validationPreview.result.failed > 0 && (
                <div className="flex justify-between">
                  <span>Errors found:</span>
                  <strong className="text-red-600 dark:text-red-400">
                    {validationPreview.result.failed}
                  </strong>
                </div>
              )}
            </div>

            {/* Validation warnings */}
            {validationPreview.result.warnings &&
              validationPreview.result.warnings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Warnings ({validationPreview.result.warnings.length}):
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 max-h-24 overflow-y-auto">
                    {validationPreview.result.warnings.slice(0, 5).map((warning, idx) => (
                      <li key={idx} className="break-words">
                        {warning.message}
                      </li>
                    ))}
                    {validationPreview.result.warnings.length > 5 && (
                      <li className="italic">
                        ... and {validationPreview.result.warnings.length - 5} more warnings
                      </li>
                    )}
                  </ul>
                </div>
              )}

            {/* Validation errors */}
            {validationPreview.result.errors &&
              validationPreview.result.errors.length > 0 && (
                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-2">
                    Errors ({validationPreview.result.errors.length}):
                  </p>
                  <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1 max-h-24 overflow-y-auto">
                    {validationPreview.result.errors.slice(0, 5).map((error, idx) => (
                      <li key={idx} className="break-words">
                        {error.message}
                      </li>
                    ))}
                    {validationPreview.result.errors.length > 5 && (
                      <li className="italic">
                        ... and {validationPreview.result.errors.length - 5} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={
                isProcessing ||
                validationPreview.result.imported === 0 ||
                validationPreview.result.failed > 0
              }
              className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? 'Importing...' : 'Confirm Import'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload form */}
      {!validationPreview && !importResult && (
        <>
          {/* Duplicate handling options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Duplicate Handling
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="skip"
                  checked={duplicateStrategy === 'skip'}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Skip duplicates (recommended)
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Keep existing prompts, only import new ones
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="update"
                  checked={duplicateStrategy === 'update'}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Update existing
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Replace existing prompts with data from backup
                  </p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="duplicateStrategy"
                  value="error"
                  checked={duplicateStrategy === 'error'}
                  onChange={(e) => setDuplicateStrategy(e.target.value as DuplicateStrategy)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Fail on duplicates
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Abort import if any duplicates are found
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* File upload */}
          <div className="mb-4">
            <label
              htmlFor="import-file"
              className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2"
            >
              Select Backup File
            </label>
            <input
              ref={fileInputRef}
              id="import-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed file:mr-4 file:py-2 file:px-4 file:rounded-l-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
          </div>

          {isProcessing && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
              Validating import file...
            </div>
          )}
        </>
      )}

      {/* Info box */}
      {!validationPreview && !importResult && (
        <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Import process:
          </h3>
          <ol className="text-xs text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
            <li>Select your duplicate handling strategy</li>
            <li>Choose a JSON backup file exported from this system</li>
            <li>Review the validation preview and statistics</li>
            <li>Confirm to complete the import</li>
          </ol>
          <p className="mt-3 text-xs text-blue-700 dark:text-blue-300">
            All text content is sanitized to prevent XSS attacks. Tags are automatically created
            if they don&apos;t exist. The import uses database transactions to ensure data
            integrity.
          </p>
        </div>
      )}
    </div>
  )
}
