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
import { getCopyPreferences } from '@/lib/users/actions'
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
  const [removePastePlaceholders, setRemovePastePlaceholders] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    // Use queueMicrotask to avoid synchronous setState in effect warning
    queueMicrotask(() => setMounted(true))

    const loadPreferences = async () => {
      if (userId) {
        // User is logged in - try per-prompt settings first, then fall back to global
        try {
          const promptPrefs = await getPromptCopyPreferences(promptId)
          if (promptPrefs) {
            // Use per-prompt preferences
            setPrefix(promptPrefs.copyPrefix)
            setSuffix(promptPrefs.copySuffix)
            setAddPrefix(promptPrefs.copyAddPrefix)
            setAddSuffix(promptPrefs.copyAddSuffix)
            setUseUltrathink(promptPrefs.copyUseUltrathink)
            setGithubReminder(promptPrefs.copyGithubReminder)
            setRemovePastePlaceholders(promptPrefs.copyRemovePastePlaceholders)
          } else {
            // No per-prompt preferences, try global settings
            const globalPrefs = await getCopyPreferences()
            if (globalPrefs) {
              setPrefix(globalPrefs.copyPrefix)
              setSuffix(globalPrefs.copySuffix)
              setAddPrefix(globalPrefs.copyAddPrefix)
              setAddSuffix(globalPrefs.copyAddSuffix)
              setUseUltrathink(globalPrefs.copyUseUltrathink)
              setGithubReminder(globalPrefs.copyGithubReminder)
              setRemovePastePlaceholders(globalPrefs.copyRemovePastePlaceholders)
            } else {
              // Fall back to localStorage
              loadFromLocalStorage()
            }
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
      // Check for per-prompt settings first, then fall back to global settings
      const getWithFallback = (promptKey: string, globalKey: string): string | null => {
        const promptValue = localStorage.getItem(promptKey)
        if (promptValue !== null) return promptValue
        return localStorage.getItem(globalKey)
      }

      const getBoolWithFallback = (promptKey: string, globalKey: string): boolean => {
        const promptValue = localStorage.getItem(promptKey)
        if (promptValue !== null) return promptValue === 'true'
        return localStorage.getItem(globalKey) === 'true'
      }

      const savedPrefix = getWithFallback(
        `prompt-${promptId}-copy-prefix`,
        'prompt-copy-prefix'
      )
      const savedSuffix = getWithFallback(
        `prompt-${promptId}-copy-suffix`,
        'prompt-copy-suffix'
      )
      const savedAddPrefix = getBoolWithFallback(
        `prompt-${promptId}-copy-add-prefix`,
        'prompt-copy-add-prefix'
      )
      const savedAddSuffix = getBoolWithFallback(
        `prompt-${promptId}-copy-add-suffix`,
        'prompt-copy-add-suffix'
      )
      const savedUseUltrathink = getBoolWithFallback(
        `prompt-${promptId}-copy-use-ultrathink`,
        'prompt-copy-use-ultrathink'
      )
      const savedGithubReminder = getBoolWithFallback(
        `prompt-${promptId}-copy-github-reminder`,
        'prompt-copy-github-reminder'
      )
      const savedRemovePastePlaceholders = getBoolWithFallback(
        `prompt-${promptId}-copy-remove-paste-placeholders`,
        'prompt-copy-remove-paste-placeholders'
      )

      if (savedPrefix !== null) setPrefix(savedPrefix)
      if (savedSuffix !== null) setSuffix(savedSuffix)
      setAddPrefix(savedAddPrefix)
      setAddSuffix(savedAddSuffix)
      setUseUltrathink(savedUseUltrathink)
      setGithubReminder(savedGithubReminder)
      setRemovePastePlaceholders(savedRemovePastePlaceholders)
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

    // Remove paste placeholders first (before adding prefix/suffix)
    if (removePastePlaceholders) {
      // Match [PASTE ...], [Paste ...], [paste ...] patterns
      finalText = finalText.replace(/\[(?:PASTE|Paste|paste)[^\]]*\]/g, '')
      // Clean up extra whitespace that might be left
      finalText = finalText.replace(/\n{3,}/g, '\n\n').trim()
    }

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
      {(addPrefix || addSuffix || useUltrathink || githubReminder || removePastePlaceholders) && (
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Preview includes your copy settings. Use the Options button above to change them.
        </p>
      )}
    </div>
  )
}
