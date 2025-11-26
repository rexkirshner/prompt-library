/**
 * Edit Compound Prompt Form Component
 *
 * Client component for editing existing compound prompts with validation.
 */

'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CompoundPromptBuilder } from '@/components/compound-prompts/CompoundPromptBuilder'
import { TagInput } from '@/components/TagInput'
import { CATEGORIES } from '@/lib/prompts/validation'
import {
  updateCompoundPrompt,
  type ComponentData,
  type CompoundPromptResult,
} from '../../actions'
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
      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
    >
      {pending ? 'Saving changes...' : 'Save Changes'}
    </button>
  )
}

interface EditCompoundPromptFormProps {
  prompt: {
    id: string
    title: string
    slug: string
    status: string
    category: string
    description: string
    authorName: string
    tags: string[]
    components: ComponentData[]
  }
  availablePrompts: BasePromptOption[]
}

/**
 * Edit compound prompt form with validation and error handling
 */
export function EditCompoundPromptForm({
  prompt,
  availablePrompts,
}: EditCompoundPromptFormProps) {
  const [tags, setTags] = useState<string[]>(prompt.tags)
  const [components, setComponents] = useState<ComponentData[]>(prompt.components)

  const handleSubmit = async (
    prevState: CompoundPromptResult | null,
    formData: FormData,
  ): Promise<CompoundPromptResult> => {
    const data = {
      id: prompt.id,
      slug: prompt.slug,
      status: prompt.status,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || '',
      category: formData.get('category') as string,
      authorName: formData.get('authorName') as string,
      components,
      tags,
    }

    return updateCompoundPrompt(data)
  }

  const [state, formAction] = useActionState<CompoundPromptResult | null, FormData>(
    handleSubmit,
    null,
  )

  return (
    <form action={formAction} className="space-y-8">
      {/* Form-level error */}
      {state?.errors?.form && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{state.errors.form}</p>
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
            Title <span className="text-red-600">*</span>
          </label>
          <div className="mt-2">
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={100}
              defaultValue={prompt.title}
              placeholder="e.g., Complete Code Review Workflow"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500"
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
            Category <span className="text-red-600">*</span>
          </label>
          <div className="mt-2">
            <select
              id="category"
              name="category"
              required
              defaultValue={prompt.category}
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700"
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
            <p
              id="category-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {state.errors.category}
            </p>
          )}
        </div>

        {/* Tags field */}
        <TagInput
          tags={tags}
          onTagsChange={setTags}
          minTags={1}
          maxTags={5}
          error={state?.errors?.form}
        />

        {/* Description field (optional) */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Description <span className="text-gray-500">(optional)</span>
          </label>
          <div className="mt-2">
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              defaultValue={prompt.description}
              placeholder="Brief explanation of when and how to use this compound prompt..."
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500"
              aria-invalid={state?.errors?.description ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.description ? 'description-error' : 'description-help'
              }
            />
          </div>
          <p
            id="description-help"
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Up to 500 characters.
          </p>
          {state?.errors?.description && (
            <p
              id="description-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {state.errors.description}
            </p>
          )}
        </div>

        {/* Author name field */}
        <div>
          <label
            htmlFor="authorName"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Author Name <span className="text-red-600">*</span>
          </label>
          <div className="mt-2">
            <input
              id="authorName"
              name="authorName"
              type="text"
              required
              maxLength={100}
              defaultValue={prompt.authorName}
              placeholder="Your name or pseudonym"
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 dark:bg-gray-800 dark:text-gray-100 dark:ring-gray-700 dark:placeholder:text-gray-500"
              aria-invalid={state?.errors?.authorName ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.authorName ? 'author-error' : 'author-help'
              }
            />
          </div>
          <p
            id="author-help"
            className="mt-2 text-sm text-gray-500 dark:text-gray-400"
          >
            Attribution will be displayed on the prompt page.
          </p>
          {state?.errors?.authorName && (
            <p
              id="author-error"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {state.errors.authorName}
            </p>
          )}
        </div>
      </div>

      {/* Components Section */}
      <div className="border-t border-gray-200 pt-8 dark:border-gray-700">
        <CompoundPromptBuilder
          initialComponents={components}
          availablePrompts={availablePrompts}
          excludePromptId={prompt.id}
          onComponentsChange={setComponents}
          errors={state?.errors}
        />
      </div>

      {/* Submit button */}
      <div className="border-t border-gray-200 pt-6 dark:border-gray-700">
        <SubmitButton />
      </div>
    </form>
  )
}
