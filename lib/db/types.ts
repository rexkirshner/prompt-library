/**
 * Database types exported for use throughout the application
 * Importing from this file doesn't initialize the Prisma Client
 */

export type { prompts, users, tags, prompt_tags, prompt_edits, admin_actions } from '@prisma/client'
export { PromptStatus, ReviewStatus } from '@prisma/client'
