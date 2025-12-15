/**
 * Tag Input Component
 *
 * Allows users to add/remove tags with validation and normalization.
 * Shows tag count and enforces min/max limits.
 */

'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import { normalizeTag, isValidTag } from '@/lib/prompts/validation'

interface TagInputProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  minTags?: number
  maxTags?: number
  error?: string
}

export function TagInput({
  tags,
  onTagsChange,
  minTags = 1,
  maxTags = 5,
  error,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [inputError, setInputError] = useState('')
  // Track if we just added a tag to prevent double-adds from onBlur
  const justAddedRef = useRef(false)

  const addTag = (tagInput: string) => {
    const normalized = normalizeTag(tagInput)

    // Clear any previous input error
    setInputError('')

    // Validate tag
    if (!normalized || normalized.length === 0) {
      setInputError('Tag cannot be empty')
      return
    }

    if (!isValidTag(normalized)) {
      setInputError('Tags can only contain lowercase letters, numbers, and hyphens')
      return
    }

    // Check if already exists
    if (tags.includes(normalized)) {
      setInputError('Tag already added')
      return
    }

    // Check max limit
    if (tags.length >= maxTags) {
      setInputError(`Maximum ${maxTags} tags allowed`)
      return
    }

    // Add tag
    onTagsChange([...tags, normalized])
    setInput('')
  }

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (input.trim()) {
        // Set flag to prevent onBlur from double-adding
        justAddedRef.current = true
        addTag(input.trim())
        // Reset flag after a short delay
        setTimeout(() => {
          justAddedRef.current = false
        }, 100)
      }
    } else if (e.key === 'Backspace' && input === '' && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div>
      <label
        htmlFor="tag-input"
        className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
      >
        Tags ({tags.length}/{maxTags})
      </label>

      {/* Tag display */}
      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="mt-2">
        <input
          id="tag-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Skip if we just added via Enter key (prevents double-adds)
            if (justAddedRef.current) {
              return
            }
            if (input.trim()) {
              addTag(input.trim())
            }
          }}
          placeholder="Type a tag and press Enter"
          className="block w-full rounded-md border-0 bg-white px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-600 dark:placeholder:text-gray-500 sm:text-sm sm:leading-6"
          aria-invalid={error || inputError ? 'true' : 'false'}
          aria-describedby={
            error || inputError ? 'tag-error' : 'tag-help'
          }
        />
      </div>

      {/* Help text */}
      <p id="tag-help" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Minimum {minTags} tag{minTags > 1 ? 's' : ''} required. Press Enter to add tags. Use lowercase letters, numbers, and hyphens only.
      </p>

      {/* Errors */}
      {(error || inputError) && (
        <p id="tag-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error || inputError}
        </p>
      )}

      {/* Hidden inputs for form submission */}
      {tags.map((tag, index) => (
        <input
          key={`tag-${index}`}
          type="hidden"
          name={`tag-${index}`}
          value={tag}
        />
      ))}
    </div>
  )
}
