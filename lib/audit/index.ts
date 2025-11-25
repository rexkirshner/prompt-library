/**
 * User Action Audit Logging
 *
 * Provides comprehensive audit logging for security-sensitive user actions.
 * Tracks password changes, email changes, and other sensitive operations
 * for security monitoring and compliance.
 *
 * @security
 * Audit logs are critical for:
 * - Investigating security incidents
 * - Compliance with data protection regulations
 * - User accountability and transparency
 * - Detecting suspicious activity patterns
 */

import { randomUUID } from 'crypto'
import { prisma } from '@/lib/db/client'
import { Prisma } from '@prisma/client'

/**
 * Standard action types for user activities
 */
export const USER_ACTIONS = {
  PASSWORD_CHANGED: 'password_changed',
  EMAIL_CHANGED: 'email_changed',
  PROFILE_UPDATED: 'profile_updated',
  ACCOUNT_DELETED: 'account_deleted',
  TWO_FACTOR_ENABLED: 'two_factor_enabled',
  TWO_FACTOR_DISABLED: 'two_factor_disabled',
} as const

export type UserAction = (typeof USER_ACTIONS)[keyof typeof USER_ACTIONS]

/**
 * Metadata for audit log entries
 */
export interface AuditMetadata {
  /**
   * IP address of the user (for security tracking)
   */
  ipAddress?: string

  /**
   * User agent string (browser/device info)
   */
  userAgent?: string

  /**
   * Additional context specific to the action
   */
  details?: Record<string, unknown>
}

/**
 * Result of logging an audit entry
 */
export interface LogAuditResult {
  success: boolean
  error?: string
  actionId?: string
}

/**
 * Log a user action to the audit trail
 *
 * @param userId - ID of the user performing the action
 * @param action - Type of action being performed
 * @param metadata - Additional context about the action
 * @returns Result indicating success or failure
 *
 * @example
 * ```typescript
 * // Log a password change
 * await logUserAction('user-123', USER_ACTIONS.PASSWORD_CHANGED, {
 *   ipAddress: '192.168.1.1',
 *   userAgent: 'Mozilla/5.0...',
 *   details: { method: 'self-service' }
 * })
 *
 * // Log without optional metadata
 * await logUserAction('user-123', USER_ACTIONS.PROFILE_UPDATED)
 * ```
 *
 * @security
 * - Never log sensitive data (passwords, tokens, etc.) in metadata
 * - IP addresses and user agents are logged for security tracking
 * - Metadata is stored as JSON for flexible querying
 */
export async function logUserAction(
  userId: string,
  action: UserAction | string,
  metadata?: AuditMetadata,
): Promise<LogAuditResult> {
  try {
    // Validate inputs
    if (!userId || userId.trim().length === 0) {
      return { success: false, error: 'User ID is required' }
    }

    if (!action || action.trim().length === 0) {
      return { success: false, error: 'Action is required' }
    }

    // Build metadata object
    const auditMetadata: Prisma.JsonObject = {}

    if (metadata?.ipAddress) {
      auditMetadata.ip_address = metadata.ipAddress
    }

    if (metadata?.userAgent) {
      auditMetadata.user_agent = metadata.userAgent
    }

    if (metadata?.details) {
      auditMetadata.details = metadata.details as Prisma.JsonValue
    }

    // Create audit log entry
    const actionId = randomUUID()
    await prisma.user_actions.create({
      data: {
        id: actionId,
        user_id: userId,
        action: action,
        ip_address: metadata?.ipAddress || null,
        user_agent: metadata?.userAgent || null,
        metadata: Object.keys(auditMetadata).length > 0 ? (auditMetadata as Prisma.InputJsonValue) : Prisma.DbNull,
      },
    })

    return { success: true, actionId }
  } catch (error) {
    console.error('Failed to log user action:', error)
    return { success: false, error: 'Failed to create audit log entry' }
  }
}

/**
 * Retrieve audit log entries for a user
 *
 * @param userId - ID of the user to get logs for
 * @param options - Query options (limit, action filter)
 * @returns Array of audit log entries
 *
 * @example
 * ```typescript
 * // Get recent password changes for a user
 * const logs = await getUserAuditLogs('user-123', {
 *   action: USER_ACTIONS.PASSWORD_CHANGED,
 *   limit: 10
 * })
 *
 * // Get all recent actions
 * const allLogs = await getUserAuditLogs('user-123', { limit: 50 })
 * ```
 */
export async function getUserAuditLogs(
  userId: string,
  options?: {
    action?: UserAction | string
    limit?: number
  },
) {
  const { action, limit = 50 } = options || {}

  return await prisma.user_actions.findMany({
    where: {
      user_id: userId,
      ...(action && { action }),
    },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
    select: {
      id: true,
      user_id: true,
      action: true,
      ip_address: true,
      user_agent: true,
      metadata: true,
      created_at: true,
    },
  })
}

/**
 * Get audit logs for a specific action type across all users
 * (Admin/security monitoring use case)
 *
 * @param action - The action type to filter by
 * @param limit - Maximum number of entries to return
 * @returns Array of audit log entries with user info
 *
 * @example
 * ```typescript
 * // Monitor recent password changes across all users
 * const passwordChanges = await getActionAuditLogs(
 *   USER_ACTIONS.PASSWORD_CHANGED,
 *   100
 * )
 * ```
 */
export async function getActionAuditLogs(
  action: UserAction | string,
  limit = 100,
) {
  return await prisma.user_actions.findMany({
    where: { action },
    orderBy: {
      created_at: 'desc',
    },
    take: limit,
    select: {
      id: true,
      user_id: true,
      action: true,
      ip_address: true,
      user_agent: true,
      metadata: true,
      created_at: true,
      users: {
        select: {
          email: true,
          name: true,
        },
      },
    },
  })
}
