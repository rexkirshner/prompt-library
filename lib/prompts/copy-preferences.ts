/**
 * Per-Prompt Copy Preferences Actions
 *
 * Server actions for managing copy preferences on a per-prompt basis.
 * Each user can have different copy settings for each prompt.
 */

'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'prompts/copy-preferences' })

export interface PromptCopyPreferences {
  copyPrefix: string
  copySuffix: string
  copyAddPrefix: boolean
  copyAddSuffix: boolean
  copyUseUltrathink: boolean
  copyGithubReminder: boolean
}

/**
 * Get user's copy preferences for a specific prompt
 */
export async function getPromptCopyPreferences(
  promptId: string
): Promise<PromptCopyPreferences | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  try {
    const prefs = await prisma.user_prompt_preferences.findUnique({
      where: {
        user_id_prompt_id: {
          user_id: session.user.id,
          prompt_id: promptId,
        },
      },
    })

    if (!prefs) {
      return null
    }

    return {
      copyPrefix: prefs.copy_prefix || '',
      copySuffix: prefs.copy_suffix || '',
      copyAddPrefix: prefs.copy_add_prefix,
      copyAddSuffix: prefs.copy_add_suffix,
      copyUseUltrathink: prefs.copy_use_ultrathink,
      copyGithubReminder: prefs.copy_github_reminder,
    }
  } catch (error) {
    logger.error('Failed to get prompt copy preferences', error as Error, {
      userId: session.user.id,
      promptId,
    })
    return null
  }
}

/**
 * Save user's copy preferences for a specific prompt
 */
export async function savePromptCopyPreferences(
  promptId: string,
  preferences: PromptCopyPreferences
): Promise<boolean> {
  const session = await auth()

  if (!session?.user?.id) {
    return false
  }

  try {
    await prisma.user_prompt_preferences.upsert({
      where: {
        user_id_prompt_id: {
          user_id: session.user.id,
          prompt_id: promptId,
        },
      },
      update: {
        copy_prefix: preferences.copyPrefix,
        copy_suffix: preferences.copySuffix,
        copy_add_prefix: preferences.copyAddPrefix,
        copy_add_suffix: preferences.copyAddSuffix,
        copy_use_ultrathink: preferences.copyUseUltrathink,
        copy_github_reminder: preferences.copyGithubReminder,
        updated_at: new Date(),
      },
      create: {
        user_id: session.user.id,
        prompt_id: promptId,
        copy_prefix: preferences.copyPrefix,
        copy_suffix: preferences.copySuffix,
        copy_add_prefix: preferences.copyAddPrefix,
        copy_add_suffix: preferences.copyAddSuffix,
        copy_use_ultrathink: preferences.copyUseUltrathink,
        copy_github_reminder: preferences.copyGithubReminder,
      },
    })

    return true
  } catch (error) {
    logger.error('Failed to save prompt copy preferences', error as Error, {
      userId: session.user.id,
      promptId,
    })
    return false
  }
}
