/**
 * Edit Prompt Form Component
 *
 * Client component for editing existing prompts with validation.
 */

'use client'

import { useState, useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updatePrompt, type EditPromptResult } from './actions'
import { TagInput } from '@/components/TagInput'
import { CATEGORIES } from '@/lib/prompts/validation'

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
      {pending ? 'Saving changes...' : 'Save Changes'}
    </button>
  )
}

interface EditPromptFormProps {
  prompt: {
    id: string
    title: string
    slug: string
    status: string
    promptText: string
    category: string
    description: string
    exampleOutput: string
    authorName: string
    authorUrl: string
    tags: string[]
  }
}

/**
 * Edit prompt form with validation and error handling
 */
export function EditPromptForm({ prompt }: EditPromptFormProps) {
  const [tags, setTags] = useState<string[]>(prompt.tags)
  const [promptText, setPromptText] = useState(prompt.promptText)
  const [showPreview, setShowPreview] = useState(false)

  const handleSubmit = async (
    prevState: EditPromptResult | null,
    formData: FormData,
  ): Promise<EditPromptResult> => {
    const data = {
      id: prompt.id,
      slug: prompt.slug,
      status: prompt.status,
      title: formData.get('title') as string,
      promptText: formData.get('promptText') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      exampleOutput: formData.get('exampleOutput') as string,
      authorName: formData.get('authorName') as string,
      authorUrl: formData.get('authorUrl') as string,
      tags,
    }

    return updatePrompt(data)
  }

  const [state, formAction] = useActionState<EditPromptResult | null, FormData>(
    handleSubmit,
    null,
  )

  return (
    <form action={formAction} className="space-y-6">
      {/* Form-level error */}
      {state?.errors?.form && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{state.errors.form}</p>
        </div>
      )}

      {/* Title field */}
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium leading-6 text-gray-900"
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
            placeholder="e.g., Code Review Assistant"
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.title ? 'true' : 'false'}
            aria-describedby={state?.errors?.title ? 'title-error' : 'title-help'}
          />
        </div>
        <p id="title-help" className="mt-2 text-sm text-gray-500">
          10-100 characters. Be concise and descriptive.
        </p>
        {state?.errors?.title && (
          <p id="title-error" className="mt-2 text-sm text-red-600">
            {state.errors.title}
          </p>
        )}
      </div>

      {/* Prompt text field with preview toggle */}
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="promptText"
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Prompt Text <span className="text-red-600">*</span>
          </label>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        <div className="mt-2">
          {!showPreview ? (
            <textarea
              id="promptText"
              name="promptText"
              rows={10}
              required
              maxLength={5000}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Enter your prompt here..."
              className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-mono"
              aria-invalid={state?.errors?.promptText ? 'true' : 'false'}
              aria-describedby={
                state?.errors?.promptText ? 'prompt-error' : 'prompt-help'
              }
            />
          ) : (
            <div className="rounded-md border border-gray-300 bg-gray-50 px-3 py-2 min-h-[240px] whitespace-pre-wrap font-mono text-sm">
              {promptText || (
                <span className="text-gray-400">Preview will appear here...</span>
              )}
            </div>
          )}
        </div>
        <p id="prompt-help" className="mt-2 text-sm text-gray-500">
          {promptText.length}/5000 characters. Minimum 150 characters required.
        </p>
        {state?.errors?.promptText && (
          <p id="prompt-error" className="mt-2 text-sm text-red-600">
            {state.errors.promptText}
          </p>
        )}
      </div>

      {/* Category field */}
      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Category <span className="text-red-600">*</span>
        </label>
        <div className="mt-2">
          <select
            id="category"
            name="category"
            required
            defaultValue={prompt.category}
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.category ? 'true' : 'false'}
            aria-describedby={state?.errors?.category ? 'category-error' : undefined}
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
          <p id="category-error" className="mt-2 text-sm text-red-600">
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
        error={state?.errors?.tags}
      />

      {/* Description field (optional) */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium leading-6 text-gray-900"
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
            placeholder="Brief explanation of when and how to use this prompt..."
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.description ? 'true' : 'false'}
            aria-describedby={
              state?.errors?.description ? 'description-error' : 'description-help'
            }
          />
        </div>
        <p id="description-help" className="mt-2 text-sm text-gray-500">
          Up to 500 characters.
        </p>
        {state?.errors?.description && (
          <p id="description-error" className="mt-2 text-sm text-red-600">
            {state.errors.description}
          </p>
        )}
      </div>

      {/* Example output field (optional) */}
      <div>
        <label
          htmlFor="exampleOutput"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Example Output <span className="text-gray-500">(optional)</span>
        </label>
        <div className="mt-2">
          <textarea
            id="exampleOutput"
            name="exampleOutput"
            rows={4}
            maxLength={1000}
            defaultValue={prompt.exampleOutput}
            placeholder="Sample of what this prompt produces..."
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-mono text-sm"
            aria-invalid={state?.errors?.exampleOutput ? 'true' : 'false'}
            aria-describedby={
              state?.errors?.exampleOutput ? 'example-error' : 'example-help'
            }
          />
        </div>
        <p id="example-help" className="mt-2 text-sm text-gray-500">
          Up to 1000 characters.
        </p>
        {state?.errors?.exampleOutput && (
          <p id="example-error" className="mt-2 text-sm text-red-600">
            {state.errors.exampleOutput}
          </p>
        )}
      </div>

      {/* Author name field */}
      <div>
        <label
          htmlFor="authorName"
          className="block text-sm font-medium leading-6 text-gray-900"
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
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.authorName ? 'true' : 'false'}
            aria-describedby={
              state?.errors?.authorName ? 'author-error' : 'author-help'
            }
          />
        </div>
        <p id="author-help" className="mt-2 text-sm text-gray-500">
          Attribution will be displayed on the prompt page.
        </p>
        {state?.errors?.authorName && (
          <p id="author-error" className="mt-2 text-sm text-red-600">
            {state.errors.authorName}
          </p>
        )}
      </div>

      {/* Author URL field (optional) */}
      <div>
        <label
          htmlFor="authorUrl"
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          Author Website <span className="text-gray-500">(optional)</span>
        </label>
        <div className="mt-2">
          <input
            id="authorUrl"
            name="authorUrl"
            type="url"
            defaultValue={prompt.authorUrl}
            placeholder="https://example.com"
            className="block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            aria-invalid={state?.errors?.authorUrl ? 'true' : 'false'}
            aria-describedby={
              state?.errors?.authorUrl ? 'author-url-error' : 'author-url-help'
            }
          />
        </div>
        <p id="author-url-help" className="mt-2 text-sm text-gray-500">
          Link to your website or portfolio.
        </p>
        {state?.errors?.authorUrl && (
          <p id="author-url-error" className="mt-2 text-sm text-red-600">
            {state.errors.authorUrl}
          </p>
        )}
      </div>

      {/* Submit button */}
      <SubmitButton />
    </form>
  )
}
