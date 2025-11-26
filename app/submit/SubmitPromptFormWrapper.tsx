/**
 * Submit Prompt Form Wrapper
 *
 * Client component that allows users to choose between regular and compound prompts.
 */

'use client'

import { useState } from 'react'
import { SubmitPromptForm } from './SubmitPromptForm'
import { SubmitCompoundPromptForm } from './SubmitCompoundPromptForm'
import type { BasePromptOption } from '@/components/compound-prompts/BasePromptSelector'

interface SubmitPromptFormWrapperProps {
  defaultAuthorName: string
  availablePrompts: BasePromptOption[]
}

type PromptType = 'regular' | 'compound'

export function SubmitPromptFormWrapper({
  defaultAuthorName,
  availablePrompts,
}: SubmitPromptFormWrapperProps) {
  const [promptType, setPromptType] = useState<PromptType>('regular')

  return (
    <div className="space-y-6">
      {/* Prompt Type Selector */}
      <div>
        <label className="block text-sm font-medium leading-6 text-gray-900 mb-3">
          Prompt Type
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPromptType('regular')}
            className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
              promptType === 'regular'
                ? 'border-blue-600 ring-2 ring-blue-600'
                : 'border-gray-300'
            }`}
          >
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="block text-sm font-medium text-gray-900">
                  Regular Prompt
                </span>
                {promptType === 'regular' && (
                  <svg
                    className="h-5 w-5 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="mt-1 flex items-center text-sm text-gray-500">
                Submit a single, standalone prompt with your own text
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPromptType('compound')}
            className={`relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none ${
              promptType === 'compound'
                ? 'border-blue-600 ring-2 ring-blue-600'
                : 'border-gray-300'
            }`}
          >
            <div className="flex flex-1 flex-col">
              <div className="flex items-center justify-between">
                <span className="block text-sm font-medium text-gray-900">
                  Compound Prompt
                </span>
                {promptType === 'compound' && (
                  <svg
                    className="h-5 w-5 text-blue-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="mt-1 flex items-center text-sm text-gray-500">
                Combine multiple existing prompts with custom text
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Form based on selected type */}
      {promptType === 'regular' && (
        <SubmitPromptForm defaultAuthorName={defaultAuthorName} />
      )}
      {promptType === 'compound' && (
        <SubmitCompoundPromptForm
          availablePrompts={availablePrompts}
          defaultAuthorName={defaultAuthorName}
        />
      )}
    </div>
  )
}
