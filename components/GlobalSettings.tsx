/**
 * Global Settings Component
 *
 * Modal for configuring global copy preferences (prefix/suffix).
 * Saves to database for logged-in users, localStorage for anonymous users.
 */

'use client'

import { useState, useEffect } from 'react'
import { getCopyPreferences, saveCopyPreferences } from '@/lib/users/actions'
import { clientLogger } from '@/lib/logging/client'

interface GlobalSettingsProps {
  userId?: string
}

export function GlobalSettings({ userId }: GlobalSettingsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [addPrefix, setAddPrefix] = useState(false)
  const [addSuffix, setAddSuffix] = useState(false)
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [useUltrathink, setUseUltrathink] = useState(false)
  const [githubReminder, setGithubReminder] = useState(false)
  const [removePastePlaceholders, setRemovePastePlaceholders] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load saved preferences on mount
  useEffect(() => {
    // Use queueMicrotask to avoid synchronous setState in effect warning
    queueMicrotask(() => setMounted(true))

    const loadPreferences = async () => {
      if (userId) {
        // User is logged in - load from database
        try {
          const prefs = await getCopyPreferences()
          if (prefs) {
            setPrefix(prefs.copyPrefix)
            setSuffix(prefs.copySuffix)
            setAddPrefix(prefs.copyAddPrefix)
            setAddSuffix(prefs.copyAddSuffix)
            setUseUltrathink(prefs.copyUseUltrathink)
            setGithubReminder(prefs.copyGithubReminder)
            setRemovePastePlaceholders(prefs.copyRemovePastePlaceholders)
          }
        } catch (error) {
          clientLogger.error('Failed to load preferences from database', error as Error)
          // Fall back to localStorage on error
          loadFromLocalStorage()
        }
      } else {
        // Anonymous user - load from localStorage
        loadFromLocalStorage()
      }
    }

    const loadFromLocalStorage = () => {
      const savedPrefix = localStorage.getItem('prompt-copy-prefix')
      const savedSuffix = localStorage.getItem('prompt-copy-suffix')
      const savedAddPrefix = localStorage.getItem('prompt-copy-add-prefix') === 'true'
      const savedAddSuffix = localStorage.getItem('prompt-copy-add-suffix') === 'true'
      const savedUseUltrathink = localStorage.getItem('prompt-copy-use-ultrathink') === 'true'
      const savedGithubReminder = localStorage.getItem('prompt-copy-github-reminder') === 'true'
      const savedRemovePastePlaceholders = localStorage.getItem('prompt-copy-remove-paste-placeholders') === 'true'

      if (savedPrefix !== null) setPrefix(savedPrefix)
      if (savedSuffix !== null) setSuffix(savedSuffix)
      setAddPrefix(savedAddPrefix)
      setAddSuffix(savedAddSuffix)
      setUseUltrathink(savedUseUltrathink)
      setGithubReminder(savedGithubReminder)
      setRemovePastePlaceholders(savedRemovePastePlaceholders)
    }

    loadPreferences()
  }, [userId])

  const handleSave = async () => {
    if (!mounted) return

    setIsSaving(true)

    const prefs = {
      copyPrefix: prefix,
      copySuffix: suffix,
      copyAddPrefix: addPrefix,
      copyAddSuffix: addSuffix,
      copyUseUltrathink: useUltrathink,
      copyGithubReminder: githubReminder,
      copyRemovePastePlaceholders: removePastePlaceholders,
    }

    // Always save to localStorage for instant updates
    localStorage.setItem('prompt-copy-prefix', prefix)
    localStorage.setItem('prompt-copy-suffix', suffix)
    localStorage.setItem('prompt-copy-add-prefix', String(addPrefix))
    localStorage.setItem('prompt-copy-add-suffix', String(addSuffix))
    localStorage.setItem('prompt-copy-use-ultrathink', String(useUltrathink))
    localStorage.setItem('prompt-copy-github-reminder', String(githubReminder))
    localStorage.setItem('prompt-copy-remove-paste-placeholders', String(removePastePlaceholders))

    // If user is logged in, also save to database
    if (userId) {
      try {
        await saveCopyPreferences(prefs)
      } catch (error) {
        clientLogger.error('Failed to save preferences to database', error as Error)
      }
    }

    setIsSaving(false)
    setIsOpen(false)

    // Trigger a page reload to update all CopyButton instances
    window.location.reload()
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
      >
        Global Settings
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-lg rounded-lg bg-white dark:bg-gray-800 shadow-xl">
              {/* Header */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Global Copy Settings
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Configure default copy options for all prompts
                </p>
              </div>

              {/* Body */}
              <div className="px-6 py-4 space-y-4">
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
                      rows={3}
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
                      rows={3}
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

                {/* Remove paste placeholders option */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={removePastePlaceholders}
                      onChange={(e) => setRemovePastePlaceholders(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Remove [PASTE *]
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
