/**
 * Invite Generator Component
 *
 * Client component for generating invite codes with copy-to-clipboard.
 */

'use client'

import { useState } from 'react'
import { createInviteAction } from './actions'
import { clientLogger } from '@/lib/logging/client'

export function InviteGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setCopied(false)

    try {
      const result = await createInviteAction()

      if (result.success && result.inviteUrl) {
        setLastInviteUrl(result.inviteUrl)
      } else {
        setError(result.error || 'Failed to generate invite')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!lastInviteUrl) return

    try {
      await navigator.clipboard.writeText(lastInviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      clientLogger.error('Failed to copy invite to clipboard', err as Error)
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Generate New Invite
      </h2>

      {/* Error message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? 'Generating...' : 'Generate Invite Link'}
      </button>

      {/* Display last generated invite */}
      {lastInviteUrl && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Invite Link:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={lastInviteUrl}
                className="flex-1 rounded-md border-0 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600"
              />
              <button
                onClick={handleCopy}
                className="rounded-md bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                {copied ? (
                  <span className="inline-flex items-center gap-1">
                    <svg
                      className="h-4 w-4 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                    Copied
                  </span>
                ) : (
                  'Copy'
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Share this link with someone to allow them to create an account. Each invite can only
            be used once.
          </p>
        </div>
      )}
    </div>
  )
}
