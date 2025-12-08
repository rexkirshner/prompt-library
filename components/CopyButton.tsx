/**
 * Copy Button Component
 *
 * Client component for copying text to clipboard with feedback.
 * Supports optional prefix/suffix customization.
 * Optionally tracks copy count if promptId is provided.
 * Stores preferences in database for logged-in users, localStorage otherwise.
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { incrementCopyCount } from '@/lib/prompts/actions'
import {
  getPromptCopyPreferences,
  savePromptCopyPreferences,
} from '@/lib/prompts/copy-preferences'
import { getCopyPreferences } from '@/lib/users/actions'
import { clientLogger } from '@/lib/logging/client'

interface CopyButtonProps {
  text: string
  label?: string
  promptId: string // Now required for per-prompt settings
  userId?: string // Pass user ID if user is logged in
}

export function CopyButton({
  text,
  label = 'Copy to Clipboard',
  promptId,
  userId,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [addPrefix, setAddPrefix] = useState(false)
  const [addSuffix, setAddSuffix] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [useUltrathink, setUseUltrathink] = useState(false)
  const [githubReminder, setGithubReminder] = useState(false)
  const [mounted, setMounted] = useState(false)
  const optionsRef = useRef<HTMLDivElement>(null)

  // Close options when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false)
      }
    }

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showOptions])

  // Load saved preferences on mount
  // For logged-in users: fetch from database
  // For anonymous users: load from localStorage
  useEffect(() => {
    setMounted(true)

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

      if (savedPrefix !== null) setPrefix(savedPrefix)
      if (savedSuffix !== null) setSuffix(savedSuffix)
      setAddPrefix(savedAddPrefix)
      setAddSuffix(savedAddSuffix)
      setUseUltrathink(savedUseUltrathink)
      setGithubReminder(savedGithubReminder)
    }

    loadPreferences()
  }, [userId, promptId])

  // Save preferences when they change
  // For logged-in users: save to database AND localStorage (for instant updates)
  // For anonymous users: save to localStorage only
  useEffect(() => {
    if (!mounted) return

    const savePreferences = async () => {
      const prefs = {
        copyPrefix: prefix,
        copySuffix: suffix,
        copyAddPrefix: addPrefix,
        copyAddSuffix: addSuffix,
        copyUseUltrathink: useUltrathink,
        copyGithubReminder: githubReminder,
      }

      // Always save to localStorage for instant updates using prompt-specific keys
      localStorage.setItem(`prompt-${promptId}-copy-prefix`, prefix)
      localStorage.setItem(`prompt-${promptId}-copy-suffix`, suffix)
      localStorage.setItem(`prompt-${promptId}-copy-add-prefix`, String(addPrefix))
      localStorage.setItem(`prompt-${promptId}-copy-add-suffix`, String(addSuffix))
      localStorage.setItem(`prompt-${promptId}-copy-use-ultrathink`, String(useUltrathink))
      localStorage.setItem(`prompt-${promptId}-copy-github-reminder`, String(githubReminder))

      // Emit event to notify other components (like CopyPreview)
      window.dispatchEvent(new Event('copySettingsChanged'))

      // If user is logged in, also save to database
      if (userId) {
        try {
          await savePromptCopyPreferences(promptId, prefs)
        } catch (error) {
          clientLogger.error('Failed to save preferences to database', error as Error, {
            promptId,
          })
        }
      }
    }

    savePreferences()
  }, [prefix, suffix, addPrefix, addSuffix, useUltrathink, githubReminder, mounted, userId, promptId])

  const handleCopy = async () => {
    try {
      // Build final text with prefix/suffix and additional options
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

      await navigator.clipboard.writeText(finalText)
      setCopied(true)

      // Track copy count if promptId provided (fire and forget)
      if (promptId) {
        incrementCopyCount(promptId).catch((err) =>
          clientLogger.error('Failed to track copy', err as Error, { promptId })
        )
      }

      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      clientLogger.error('Failed to copy text', err as Error)
    }
  }

  return (
    <div className="relative" ref={optionsRef}>
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
        <div className="absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3 shadow-lg z-50">
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

          {/* Use ultrathink option */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useUltrathink}
                onChange={(e) => setUseUltrathink(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Use ultrathink
              </span>
            </label>
          </div>

          {/* GitHub reminder option */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={githubReminder}
                onChange={(e) => setGithubReminder(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                GitHub reminder
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
