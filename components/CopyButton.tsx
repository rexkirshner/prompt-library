/**
 * Copy Button Component
 *
 * Client component for copying text to clipboard with feedback.
 * Supports optional prefix/suffix customization.
 * Optionally tracks copy count if promptId is provided.
 */

'use client'

import { useState } from 'react'
import { incrementCopyCount } from '@/lib/prompts/actions'

interface CopyButtonProps {
  text: string
  label?: string
  promptId?: string
}

export function CopyButton({
  text,
  label = 'Copy to Clipboard',
  promptId,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [addPrefix, setAddPrefix] = useState(false)
  const [addSuffix, setAddSuffix] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')

  const handleCopy = async () => {
    try {
      // Build final text with prefix/suffix
      let finalText = text
      if (addPrefix && prefix.trim()) {
        finalText = prefix.trim() + '\n\n' + finalText
      }
      if (addSuffix && suffix.trim()) {
        finalText = finalText + '\n\n' + suffix.trim()
      }

      await navigator.clipboard.writeText(finalText)
      setCopied(true)

      // Track copy count if promptId provided (fire and forget)
      if (promptId) {
        incrementCopyCount(promptId).catch((err) =>
          console.error('Failed to track copy:', err)
        )
      }

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="space-y-3">
      {/* Copy button and options toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleCopy}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-50"
          disabled={copied}
        >
          {copied ? '✓ Copied!' : label}
        </button>
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
          aria-label="Toggle copy options"
        >
          {showOptions ? 'Hide Options' : 'Options'}
        </button>
      </div>

      {/* Prefix/Suffix options */}
      {showOptions && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
          {/* Prefix option */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addPrefix}
                onChange={(e) => setAddPrefix(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add prefix
              </span>
            </label>
            {addPrefix && (
              <textarea
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Enter text to add before the prompt..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
              />
            )}
          </div>

          {/* Suffix option */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={addSuffix}
                onChange={(e) => setAddSuffix(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Add suffix
              </span>
            </label>
            {addSuffix && (
              <textarea
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                placeholder="Enter text to add after the prompt..."
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={2}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
