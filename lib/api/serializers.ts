/**
 * API Serializers
 *
 * Transform database models to public API format.
 * Strips private fields and formats data for external consumption.
 *
 * @module lib/api/serializers
 */

/**
 * Public-facing prompt object returned by API
 */
export interface PublicPrompt {
  id: string
  slug: string
  title: string
  description: string | null
  prompt_text: string | null
  resolved_text: string
  category: string
  author_name: string
  author_url: string | null
  tags: { slug: string; name: string }[]
  is_compound: boolean
  featured: boolean
  created_at: string
  updated_at: string
}

/**
 * Database prompt with relations
 * (Subset of fields we use from the full Prisma type)
 */
interface DatabasePrompt {
  id: string
  slug: string
  title: string
  description: string | null
  prompt_text: string | null
  category: string
  author_name: string
  author_url: string | null
  is_compound: boolean
  featured: boolean
  created_at: Date
  updated_at: Date
  prompt_tags: {
    tags: {
      slug: string
      name: string
    }
  }[]
}

/**
 * Serialize a single prompt for public API
 *
 * Strips private fields (status, rejection_reason, copy_count, etc.)
 * and formats data for external consumption.
 *
 * @param prompt - Database prompt with relations
 * @param resolvedText - Pre-resolved text for compound prompts
 * @returns Public prompt object
 *
 * @example
 * const publicPrompt = serializePrompt(dbPrompt, resolvedText)
 * // Returns: { id, slug, title, ..., resolved_text }
 */
export function serializePrompt(
  prompt: DatabasePrompt,
  resolvedText: string
): PublicPrompt {
  return {
    id: prompt.id,
    slug: prompt.slug,
    title: prompt.title,
    description: prompt.description,
    prompt_text: prompt.prompt_text,
    resolved_text: resolvedText,
    category: prompt.category,
    author_name: prompt.author_name,
    author_url: prompt.author_url,
    tags: prompt.prompt_tags.map(({ tags }) => ({
      slug: tags.slug,
      name: tags.name,
    })),
    is_compound: prompt.is_compound,
    featured: prompt.featured,
    created_at: prompt.created_at.toISOString(),
    updated_at: prompt.updated_at.toISOString(),
  }
}

/**
 * Serialize an array of prompts
 *
 * @param prompts - Array of tuples: [DatabasePrompt, resolvedText]
 * @returns Array of public prompt objects
 *
 * @example
 * const publicPrompts = serializePromptList([
 *   [prompt1, resolvedText1],
 *   [prompt2, resolvedText2],
 * ])
 */
export function serializePromptList(
  prompts: Array<[DatabasePrompt, string]>
): PublicPrompt[] {
  return prompts.map(([prompt, resolvedText]) =>
    serializePrompt(prompt, resolvedText)
  )
}
