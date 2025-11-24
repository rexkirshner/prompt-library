/**
 * Prompt Submission Validation
 *
 * Client and server-side validation for prompt submissions.
 * Provides type-safe validation with clear error messages.
 */

export interface PromptSubmissionData {
  title: string
  promptText: string
  description?: string
  exampleOutput?: string
  category: string
  tags: string[]
  authorName: string
  authorUrl?: string
}

export interface ValidationResult {
  success: boolean
  errors: Record<string, string>
}

/**
 * Fixed category list from PRD
 */
export const CATEGORIES = [
  'Writing & Content',
  'Coding & Development',
  'Analysis & Research',
  'Creative & Design',
  'Business & Marketing',
  'Education & Learning',
  'Personal Productivity',
] as const

export type Category = (typeof CATEGORIES)[number]

/**
 * Field length requirements
 */
const TITLE_MIN_LENGTH = 10
const TITLE_MAX_LENGTH = 100
const PROMPT_TEXT_MIN_LENGTH = 150
const PROMPT_TEXT_MAX_LENGTH = 5000
const DESCRIPTION_MAX_LENGTH = 500
const EXAMPLE_OUTPUT_MAX_LENGTH = 1000
const AUTHOR_NAME_MAX_LENGTH = 100
const MIN_TAGS = 1
const MAX_TAGS = 5
const TAG_MAX_LENGTH = 50

/**
 * Allowed URL schemes for author URLs
 * Only http and https are safe for external links
 */
const ALLOWED_URL_SCHEMES = ['http:', 'https:']

/**
 * Validate URL format and scheme
 * Only allows http: and https: protocols to prevent XSS via javascript: URLs
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ALLOWED_URL_SCHEMES.includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Generate URL-safe slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, 100) // Limit length
}

/**
 * Validate tag format (lowercase, alphanumeric with hyphens)
 */
export function isValidTag(tag: string): boolean {
  return /^[a-z0-9-]+$/.test(tag) && tag.length > 0 && tag.length <= TAG_MAX_LENGTH
}

/**
 * Normalize tag to valid format
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .substring(0, TAG_MAX_LENGTH)
}

/**
 * Validate prompt submission form data
 */
export function validatePromptSubmission(
  data: PromptSubmissionData,
): ValidationResult {
  const errors: Record<string, string> = {}

  // Title validation
  if (!data.title || data.title.trim().length === 0) {
    errors.title = 'Title is required'
  } else if (data.title.trim().length < TITLE_MIN_LENGTH) {
    errors.title = `Title must be at least ${TITLE_MIN_LENGTH} characters`
  } else if (data.title.trim().length > TITLE_MAX_LENGTH) {
    errors.title = `Title must be less than ${TITLE_MAX_LENGTH} characters`
  }

  // Prompt text validation
  if (!data.promptText || data.promptText.trim().length === 0) {
    errors.promptText = 'Prompt text is required'
  } else if (data.promptText.trim().length < PROMPT_TEXT_MIN_LENGTH) {
    errors.promptText = `Prompt text must be at least ${PROMPT_TEXT_MIN_LENGTH} characters`
  } else if (data.promptText.trim().length > PROMPT_TEXT_MAX_LENGTH) {
    errors.promptText = `Prompt text must be less than ${PROMPT_TEXT_MAX_LENGTH} characters`
  }

  // Description validation (optional)
  if (
    data.description &&
    data.description.trim().length > DESCRIPTION_MAX_LENGTH
  ) {
    errors.description = `Description must be less than ${DESCRIPTION_MAX_LENGTH} characters`
  }

  // Example output validation (optional)
  if (
    data.exampleOutput &&
    data.exampleOutput.trim().length > EXAMPLE_OUTPUT_MAX_LENGTH
  ) {
    errors.exampleOutput = `Example output must be less than ${EXAMPLE_OUTPUT_MAX_LENGTH} characters`
  }

  // Category validation
  if (!data.category || data.category.trim().length === 0) {
    errors.category = 'Category is required'
  } else if (!CATEGORIES.includes(data.category as Category)) {
    errors.category = 'Please select a valid category'
  }

  // Tags validation
  if (!data.tags || data.tags.length === 0) {
    errors.tags = `Please add at least ${MIN_TAGS} tag`
  } else if (data.tags.length < MIN_TAGS) {
    errors.tags = `Please add at least ${MIN_TAGS} tag${MIN_TAGS > 1 ? 's' : ''}`
  } else if (data.tags.length > MAX_TAGS) {
    errors.tags = `Maximum ${MAX_TAGS} tags allowed`
  } else {
    // Validate individual tags
    const invalidTags = data.tags.filter((tag) => !isValidTag(tag))
    if (invalidTags.length > 0) {
      errors.tags = 'Tags can only contain lowercase letters, numbers, and hyphens'
    }
  }

  // Author name validation
  if (!data.authorName || data.authorName.trim().length === 0) {
    errors.authorName = 'Author name is required'
  } else if (data.authorName.trim().length > AUTHOR_NAME_MAX_LENGTH) {
    errors.authorName = `Author name must be less than ${AUTHOR_NAME_MAX_LENGTH} characters`
  }

  // Author URL validation (optional)
  if (data.authorUrl && data.authorUrl.trim().length > 0) {
    if (!isValidUrl(data.authorUrl.trim())) {
      errors.authorUrl = 'Please enter a valid URL (including http:// or https://)'
    }
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  }
}
