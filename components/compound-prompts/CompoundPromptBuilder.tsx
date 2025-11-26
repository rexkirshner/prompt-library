/**
 * Compound Prompt Builder
 *
 * Main component for building compound prompts with drag-and-drop reordering.
 * Allows adding base prompts and custom text components with live preview.
 */

'use client'

import { useState, useEffect } from 'react'
import { BasePromptSelector, type BasePromptOption } from './BasePromptSelector'
import type { ComponentData } from '@/app/admin/prompts/compound/actions'

interface CompoundPromptBuilderProps {
  initialComponents?: ComponentData[]
  availablePrompts: BasePromptOption[]
  excludePromptId?: string // ID of current compound prompt (for edit mode)
  onComponentsChange: (components: ComponentData[]) => void
  errors?: { components?: string }
}

type ComponentType = 'base_prompt' | 'custom_text'

interface DisplayComponent extends ComponentData {
  id: string // Temporary ID for React keys
  type: ComponentType
  promptTitle?: string // For display purposes
}

/**
 * Compound Prompt Builder
 *
 * Features:
 * - Drag-and-drop reordering of components
 * - Add base prompts via modal selector
 * - Add custom text components
 * - Delete components
 * - Visual feedback during drag operations
 * - Automatic position recalculation
 */
export function CompoundPromptBuilder({
  initialComponents = [],
  availablePrompts,
  excludePromptId,
  onComponentsChange,
  errors,
}: CompoundPromptBuilderProps) {
  const [components, setComponents] = useState<DisplayComponent[]>([])
  const [isSelectorOpen, setIsSelectorOpen] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Initialize components from props
  useEffect(() => {
    if (initialComponents.length > 0) {
      const displayComponents = initialComponents.map((comp, idx) => {
        const prompt = availablePrompts.find((p) => p.id === comp.component_prompt_id)
        return {
          ...comp,
          id: `component-${idx}`,
          type: comp.component_prompt_id ? ('base_prompt' as const) : ('custom_text' as const),
          promptTitle: prompt?.title,
        }
      })
      setComponents(displayComponents)
    }
  }, [initialComponents, availablePrompts])

  // Update parent when components change
  useEffect(() => {
    const componentData: ComponentData[] = components.map((comp, idx) => ({
      position: idx,
      component_prompt_id: comp.component_prompt_id,
      custom_text_before: comp.custom_text_before,
      custom_text_after: comp.custom_text_after,
    }))
    onComponentsChange(componentData)
  }, [components, onComponentsChange])

  const handleAddBasePrompt = (prompt: BasePromptOption) => {
    const newComponent: DisplayComponent = {
      id: `component-${Date.now()}`,
      type: 'base_prompt',
      position: components.length,
      component_prompt_id: prompt.id,
      custom_text_before: null,
      custom_text_after: null,
      promptTitle: prompt.title,
    }
    setComponents([...components, newComponent])
  }

  const handleAddCustomText = () => {
    const newComponent: DisplayComponent = {
      id: `component-${Date.now()}`,
      type: 'custom_text',
      position: components.length,
      component_prompt_id: null,
      custom_text_before: '',
      custom_text_after: null,
    }
    setComponents([...components, newComponent])
  }

  const handleDeleteComponent = (index: number) => {
    setComponents(components.filter((_, idx) => idx !== index))
  }

  const handleUpdateComponent = (index: number, field: string, value: string) => {
    const updated = [...components]
    updated[index] = { ...updated[index], [field]: value }
    setComponents(updated)
  }

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex === null) return

    const reordered = [...components]
    const [movedItem] = reordered.splice(draggedIndex, 1)
    reordered.splice(dropIndex, 0, movedItem)

    setComponents(reordered)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Get excluded prompt IDs (circular reference prevention)
  const excludeIds = excludePromptId ? [excludePromptId] : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Components
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIsSelectorOpen(true)}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Base Prompt
          </button>
          <button
            type="button"
            onClick={handleAddCustomText}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Add Custom Text
          </button>
        </div>
      </div>

      {/* Error message */}
      {errors?.components && (
        <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm text-red-800 dark:text-red-200">{errors.components}</p>
        </div>
      )}

      {/* Components list */}
      {components.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400">
            No components yet. Add a base prompt or custom text to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {components.map((component, index) => (
            <div
              key={component.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`group rounded-lg border bg-white p-4 transition-all dark:bg-gray-900 ${
                draggedIndex === index
                  ? 'opacity-50'
                  : dragOverIndex === index
                    ? 'border-blue-500 ring-2 ring-blue-500'
                    : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Component header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {/* Drag handle */}
                  <button
                    type="button"
                    className="cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300"
                    aria-label="Drag to reorder"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                      />
                    </svg>
                  </button>

                  {/* Component type badge */}
                  <span className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {index + 1}.
                    </span>
                    {component.type === 'base_prompt' ? (
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        Base Prompt
                      </span>
                    ) : (
                      <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        Custom Text
                      </span>
                    )}
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => handleDeleteComponent(index)}
                  className="rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label="Delete component"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>

              {/* Component content */}
              {component.type === 'base_prompt' ? (
                <div className="space-y-3">
                  {/* Custom text before */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Custom Text Before (Optional)
                    </label>
                    <textarea
                      value={component.custom_text_before || ''}
                      onChange={(e) =>
                        handleUpdateComponent(index, 'custom_text_before', e.target.value)
                      }
                      placeholder="Text to appear before this prompt..."
                      rows={2}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                  </div>

                  {/* Base prompt title (read-only) */}
                  <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {component.promptTitle || component.component_prompt_id}
                    </p>
                  </div>

                  {/* Custom text after */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Custom Text After (Optional)
                    </label>
                    <textarea
                      value={component.custom_text_after || ''}
                      onChange={(e) =>
                        handleUpdateComponent(index, 'custom_text_after', e.target.value)
                      }
                      placeholder="Text to appear after this prompt..."
                      rows={2}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Custom Text
                  </label>
                  <textarea
                    value={component.custom_text_before || ''}
                    onChange={(e) =>
                      handleUpdateComponent(index, 'custom_text_before', e.target.value)
                    }
                    placeholder="Enter your custom text..."
                    rows={3}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder:text-gray-400"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Base Prompt Selector Modal */}
      <BasePromptSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleAddBasePrompt}
        excludeIds={excludeIds}
        availablePrompts={availablePrompts}
      />
    </div>
  )
}
