/**
 * Copy Preview Component
 *
 * Shows a preview of what will be copied including prefix, suffix, and options.
 * Updates in real-time as settings change.
 * Uses per-prompt preferences.
 */

'use client'

import { useState, useEffect } from 'react'
import { getPromptCopyPreferences } from '@/lib/prompts/copy-preferences'
import { clientLogger } from '@/lib/logging/client'

interface CopyPreviewProps {
  text: string
  promptId: string
  userId?: string
}

export function CopyPreview({ text, promptId, userId }: CopyPreviewProps) {
  const [addPrefix, setAddPrefix] = useState(false)
  const [addSuffix, setAddSuffix] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [useUltrathink, setUseUltrathink] = useState(false)
  const [githubReminder, setGithubReminder] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    setMounted(true)

    const loadPreferences = async () => {
      if (userId) {
        // User is logged in - load from database for this specific prompt
        try {
          const prefs = await getPromptCopyPreferences(promptId)
          if (prefs) {
            setPrefix(prefs.copyPrefix)
            setSuffix(prefs.copySuffix)
            setAddPrefix(prefs.copyAddPrefix)
            setAddSuffix(prefs.copyAddSuffix)
            setUseUltrathink(prefs.copyUseUltrathink)
            setGithubReminder(prefs.copyGithubReminder)
          }
        } catch (error) {
          clientLogger.error('Failed to load preferences from database', error as Error, {
            promptId,
          })
          // Fall back to localStorage on error
          loadFromLocalStorage()
        }
      } else {
        // Anonymous user - load from localStorage for this specific prompt
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      // Use prompt-specific keys
      const savedPrefix = localStorage.getItem(`prompt-${promptId}-copy-prefix`)
      const savedSuffix = localStorage.getItem(`prompt-${promptId}-copy-suffix`)
      const savedAddPrefix = localStorage.getItem(`prompt-${promptId}-copy-add-prefix`) === 'true'
      const savedAddSuffix = localStorage.getItem(`prompt-${promptId}-copy-add-suffix`) === 'true'
      const savedUseUltrathink = localStorage.getItem(`prompt-${promptId}-copy-use-ultrathink`) === 'true'
      const savedGithubReminder = localStorage.getItem(`prompt-${promptId}-copy-github-reminder`) === 'true'

      if (savedPrefix !== null) setPrefix(savedPrefix)
      if (savedSuffix !== null) setSuffix(savedSuffix)
      setAddPrefix(savedAddPrefix)
      setAddSuffix(savedAddSuffix)
      setUseUltrathink(savedUseUltrathink)
      setGithubReminder(savedGithubReminder)
    }

    loadPreferences()

    // Listen for storage changes (when settings are updated in another component)
    const handleStorageChange = () => {
      loadFromLocalStorage()
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event when settings change in the same window
    const handleSettingsChange = () => {
      loadFromLocalStorage()
    }
    window.addEventListener('copySettingsChanged', handleSettingsChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('copySettingsChanged', handleSettingsChange)
    }
  }, [userId, promptId])

  // Build preview text
  const buildPreviewText = () => {
    let finalText = text
    if (addPrefix && prefix.trim()) {
      finalText = prefix.trim() + '\n\n' + finalText
    }
    if (addSuffix && suffix.trim()) {
      finalText = finalText + '\n\n' + suffix.trim()
    }
    if (useUltrathink) {
      finalText = finalText + '\n\nUse ultrathink.'
    }
    if (githubReminder) {
      finalText = finalText + '\n\nI want you to commit liberally and often, but do not push to github without my permission.'
    }
    return finalText
  }

  const previewText = mounted ? buildPreviewText() : text

  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
        Copy Preview
      </h2>
      <div className="rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300">
          {previewText}
        </pre>
      </div>
      {(addPrefix || addSuffix || useUltrathink || githubReminder) && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Preview includes your copy settings. Use the Options button above to change them.
        </p>
      )}
    </div>
  )
}
