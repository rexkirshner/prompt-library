/**
 * User Preferences Actions
 *
 * Server actions for managing user preferences (copy settings, sort order, etc.).
 */

'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db/client'
import { logger as baseLogger } from '@/lib/logging'

const logger = baseLogger.child({ module: 'users/actions' })

export interface CopyPreferences {
  copyPrefix: string
  copySuffix: string
  copyAddPrefix: boolean
  copyAddSuffix: boolean
  copyUseUltrathink: boolean
  copyGithubReminder: boolean
  copyRemovePastePlaceholders: boolean
}

/**
 * Get user's copy preferences from database
 */
export async function getCopyPreferences(): Promise<CopyPreferences | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        copy_prefix: true,
        copy_suffix: true,
        copy_add_prefix: true,
        copy_add_suffix: true,
        copy_use_ultrathink: true,
        copy_github_reminder: true,
        copy_remove_paste_placeholders: true,
      },
    })

    if (!user) {
      return null
    }

    return {
      copyPrefix: user.copy_prefix || '',
      copySuffix: user.copy_suffix || '',
      copyAddPrefix: user.copy_add_prefix,
      copyAddSuffix: user.copy_add_suffix,
      copyUseUltrathink: user.copy_use_ultrathink,
      copyGithubReminder: user.copy_github_reminder,
      copyRemovePastePlaceholders: user.copy_remove_paste_placeholders,
    }
  } catch (error) {
    logger.error(
      'Failed to get copy preferences',
      error as Error,
      { userId: session.user.id }
    )
    return null
  }
}

/**
 * Save user's copy preferences to database
 */
export async function saveCopyPreferences(
  preferences: CopyPreferences
): Promise<boolean> {
  const session = await auth()

  if (!session?.user?.id) {
    return false
  }

  try {
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        copy_prefix: preferences.copyPrefix,
        copy_suffix: preferences.copySuffix,
        copy_add_prefix: preferences.copyAddPrefix,
        copy_add_suffix: preferences.copyAddSuffix,
        copy_use_ultrathink: preferences.copyUseUltrathink,
        copy_github_reminder: preferences.copyGithubReminder,
        copy_remove_paste_placeholders: preferences.copyRemovePastePlaceholders,
      },
    })

    return true
  } catch (error) {
    logger.error(
      'Failed to save copy preferences',
      error as Error,
      { userId: session.user.id }
    )
    return false
  }
}

/**
 * Get user's sort preference from database
 */
export async function getSortPreference(): Promise<string | null> {
  const session = await auth()

  if (!session?.user?.id) {
    return null
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: {
        sort_preference: true,
      },
    })

    return user?.sort_preference || 'newest'
  } catch (error) {
    logger.error(
      'Failed to get sort preference',
      error as Error,
      { userId: session.user.id }
    )
    return null
  }
}

/**
 * Save user's sort preference to database
 */
export async function saveSortPreference(sortPreference: string): Promise<boolean> {
  const session = await auth()

  if (!session?.user?.id) {
    return false
  }

  // Validate sort preference
  const validOptions = ['newest', 'alphabetical', 'popular']
  if (!validOptions.includes(sortPreference)) {
    return false
  }

  try {
    await prisma.users.update({
      where: { id: session.user.id },
      data: {
        sort_preference: sortPreference,
      },
    })

    return true
  } catch (error) {
    logger.error(
      'Failed to save sort preference',
      error as Error,
      { userId: session.user.id }
    )
    return false
  }
}
