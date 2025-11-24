/**
 * Copy Button Component
 *
 * Client component for copying text to clipboard with feedback.
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
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
    <button
      onClick={handleCopy}
      className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      disabled={copied}
    >
      {copied ? '✓ Copied!' : label}
    </button>
  )
}
