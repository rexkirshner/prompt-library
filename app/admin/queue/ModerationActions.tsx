/**
 * Moderation Action Buttons
 *
 * Client component for approve/reject actions on pending prompts.
 */

'use client'

import { useState } from 'react'
import { approvePrompt, rejectPrompt } from './actions'

interface ModerationActionsProps {
  promptId: string
  onComplete?: () => void
}

export function ModerationActions({ promptId, onComplete }: ModerationActionsProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = async () => {
    setLoading(true)
    setError(null)

    const result = await approvePrompt(promptId)

    if (result.success) {
      onComplete?.()
    } else {
      setError(result.error || 'Failed to approve')
    }

    setLoading(false)
  }

  const handleReject = async () => {
    setLoading(true)
    setError(null)

    const result = await rejectPrompt(promptId, rejectionReason.trim() || undefined)

    if (result.success) {
      setShowRejectForm(false)
      setRejectionReason('')
      onComplete?.()
    } else {
      setError(result.error || 'Failed to reject')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {!showRejectForm ? (
        <div className="flex gap-2">
          <button
            onClick={handleApprove}
            disabled={loading}
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            {loading ? 'Approving...' : 'Approve'}
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={loading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label htmlFor="rejection-reason" className="mb-1 block text-sm font-medium">
              Rejection Reason <span className="text-gray-500 dark:text-gray-400">(optional)</span>
            </label>
            <textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
              rows={3}
              placeholder="Optionally explain why this prompt is being rejected..."
              disabled={loading}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReject}
              disabled={loading}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
            >
              {loading ? 'Rejecting...' : 'Reject'}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(false)
                setRejectionReason('')
                setError(null)
              }}
              disabled={loading}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
