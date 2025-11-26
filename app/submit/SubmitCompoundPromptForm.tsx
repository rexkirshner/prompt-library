/**
 * Submit Compound Prompt Form Component
 *
 * Client component for public compound prompt submissions.
 */

'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CompoundPromptBuilder } from '@/components/compound-prompts/CompoundPromptBuilder'
import { TagInput } from '@/components/TagInput'
import { CATEGORIES } from '@/lib/prompts/validation'
import {
  submitCompoundPrompt,
  type ComponentData,
  type CompoundSubmissionResult,
} from './compound-actions'
import type { BasePromptOption } from '@/components/compound-prompts/BasePromptSelector'

/**
 * Submit button with loading state
 */
function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Submitting compound prompt...' : 'Submit Compound Prompt'}
    </button>
  )
}

interface SubmitCompoundPromptFormProps {
  availablePrompts: BasePromptOption[]
  defaultAuthorName?: string
}

/**
 * Submit compound prompt form with validation and error handling
 */
export function SubmitCompoundPromptForm({
  availablePrompts,
  defaultAuthorName = '',
}: SubmitCompoundPromptFormProps) {
  const [tags, setTags] = useState<string[]>([])
  const [components, setComponents] = useState<ComponentData[]>([])

  const handleSubmit = async (
    prevState: CompoundSubmissionResult | null,
    formData: FormData,
  ): Promise<CompoundSubmissionResult> => {
    const data = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || '',
      category: formData.get('category') as string,
      authorName: formData.get('authorName') as string,
      authorUrl: (formData.get('authorUrl') as string) || '',
      components,
      tags,
    }

    return submitCompoundPrompt(data)
  }

  const [state, formAction] = useActionState<CompoundSubmissionResult | null, FormData>(
    handleSubmit,
    null,
  )

  return (
    <form action={formAction} className="space-y-8">
      {/* Form-level error */}
      {state?.errors?.form && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{state.errors.form}</p>
        </div>
      )}

      {/* Success message */}
      {state?.success && state.message && (
        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{state.message}</p>
        </div>
      )}

      {/* Basic Information Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Basic Information
        </h2>

        {/* Title field */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Title <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="mt-2">
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={100}
              placeholder="e.g., Complete Code Review Workflow"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.title ? 'true' : 'false'}
              aria-describedby={state?.errors?.title ? 'title-error' : 'title-help'}
            />
          </div>
          <p
            id="title-help"
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            10-100 characters. Be concise and descriptive.
          </p>
          {state?.errors?.title && (
            <p id="title-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.title}
            </p>
          )}
        </div>

        {/* Category field */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Category <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="mt-2">
            <select
              id="category"
              name="category"
              required
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.category ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.category ? 'category-error' : undefined
              }
            >
              <option value="">Select a category...</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          {state?.errors?.category && (
            <p id="category-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.category}
            </p>
          )}
        </div>

        {/* Description field */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Description <span className="text-gray-500 dark:text-gray-400">(optional)</span>
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              placeholder="Brief overview of what this compound prompt does..."
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.description ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.description
                  ? 'description-error'
                  : 'description-help'
              }
            />
          </div>
          <p id="description-help" className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Up to 500 characters. Optional but recommended.
          </p>
          {state?.errors?.description && (
            <p id="description-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.description}
            </p>
          )}
        </div>

        {/* Tags field */}
        <div>
          <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Tags <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="mt-2">
            <TagInput tags={tags} onTagsChange={setTags} />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            1-5 tags to help categorize your prompt.
          </p>
        </div>
      </div>

      {/* Author Information Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Author Information
        </h2>

        {/* Author name field */}
        <div>
          <label
            htmlFor="authorName"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Your Name <span className="text-red-600 dark:text-red-400">*</span>
          </label>
          <div className="mt-2">
            <input
              id="authorName"
              name="authorName"
              type="text"
              required
              defaultValue={defaultAuthorName}
              placeholder="John Doe"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              aria-invalid={state?.errors?.authorName ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.authorName ? 'authorName-error' : undefined
              }
            />
          </div>
          {state?.errors?.authorName && (
            <p id="authorName-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {state.errors.authorName}
            </p>
          )}
        </div>

        {/* Author URL field */}
        <div>
          <label
            htmlFor="authorUrl"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Website/URL <span className="text-gray-500 dark:text-gray-400">(optional)</span>
          </label>
          <div className="mt-2">
            <input
              id="authorUrl"
              name="authorUrl"
              type="url"
              placeholder="https://yourwebsite.com"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Link to your website, GitHub, or social profile.
          </p>
        </div>
      </div>

      {/* Component Builder Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Build Your Compound Prompt
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select existing prompts and add custom text to create a compound prompt.
        </p>

        <CompoundPromptBuilder
          availablePrompts={availablePrompts}
          components={components}
          onComponentsChange={setComponents}
        />

        {state?.errors?.components && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{state.errors.components}</p>
        )}
      </div>

      {/* Submit button */}
      <div className="flex justify-end gap-4">
        <SubmitButton />
      </div>
    </form>
  )
}
