/**
 * Tests for User Action Audit Logging
 */

import {
  logUserAction,
  getUserAuditLogs,
  getActionAuditLogs,
  USER_ACTIONS,
} from '../index'
import { prisma } from '@/lib/db/client'
import { randomUUID } from 'crypto'

describe('Audit Logging', () => {
  const testUserId1 = randomUUID()
  const testUserId2 = randomUUID()

  beforeAll(async () => {
    // Create test users
    await prisma.users.create({
      data: {
        id: testUserId1,
        email: 'audit-test-1@example.com',
        password: 'hashed',
        name: 'Audit Test User 1',
      },
    })

    await prisma.users.create({
      data: {
        id: testUserId2,
        email: 'audit-test-2@example.com',
        password: 'hashed',
        name: 'Audit Test User 2',
      },
    })
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.user_actions.deleteMany({
      where: {
        user_id: {
          in: [testUserId1, testUserId2],
        },
      },
    })

    await prisma.users.deleteMany({
      where: {
        id: {
          in: [testUserId1, testUserId2],
        },
      },
    })
  })

  beforeEach(async () => {
    // Clean up audit logs before each test
    await prisma.user_actions.deleteMany({
      where: {
        user_id: {
          in: [testUserId1, testUserId2],
        },
      },
    })
  })

  describe('logUserAction', () => {
    describe('basic functionality', () => {
      it('logs a simple action without metadata', async () => {
        const result = await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED)

        expect(result.success).toBe(true)
        expect(result.actionId).toBeDefined()
        expect(typeof result.actionId).toBe('string')

        // Verify it was saved to database
        const logs = await getUserAuditLogs(testUserId1)
        expect(logs.length).toBe(1)
        expect(logs[0].action).toBe(USER_ACTIONS.PASSWORD_CHANGED)
        expect(logs[0].user_id).toBe(testUserId1)
      })

      it('logs action with full metadata', async () => {
        const result = await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          details: { method: 'self-service', reason: 'security' },
        })

        expect(result.success).toBe(true)

        const logs = await getUserAuditLogs(testUserId1)
        expect(logs.length).toBe(1)
        expect(logs[0].ip_address).toBe('192.168.1.100')
        expect(logs[0].user_agent).toBe('Mozilla/5.0 (Test Browser)')
        expect(logs[0].metadata).toMatchObject({
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Test Browser)',
          details: { method: 'self-service', reason: 'security' },
        })
      })

      it('logs action with only IP address', async () => {
        const result = await logUserAction(testUserId1, USER_ACTIONS.PROFILE_UPDATED, {
          ipAddress: '10.0.0.1',
        })

        expect(result.success).toBe(true)

        const logs = await getUserAuditLogs(testUserId1)
        expect(logs[0].ip_address).toBe('10.0.0.1')
        expect(logs[0].user_agent).toBeNull()
      })

      it('logs action with only user agent', async () => {
        const result = await logUserAction(testUserId1, USER_ACTIONS.PROFILE_UPDATED, {
          userAgent: 'Chrome/120.0.0',
        })

        expect(result.success).toBe(true)

        const logs = await getUserAuditLogs(testUserId1)
        expect(logs[0].user_agent).toBe('Chrome/120.0.0')
        expect(logs[0].ip_address).toBeNull()
      })

      it('logs custom action types', async () => {
        const result = await logUserAction(testUserId1, 'custom_action_type')

        expect(result.success).toBe(true)

        const logs = await getUserAuditLogs(testUserId1)
        expect(logs[0].action).toBe('custom_action_type')
      })
    })

    describe('validation', () => {
      it('rejects empty user ID', async () => {
        const result = await logUserAction('', USER_ACTIONS.PASSWORD_CHANGED)

        expect(result.success).toBe(false)
        expect(result.error).toBe('User ID is required')
        expect(result.actionId).toBeUndefined()
      })

      it('rejects whitespace-only user ID', async () => {
        const result = await logUserAction('   ', USER_ACTIONS.PASSWORD_CHANGED)

        expect(result.success).toBe(false)
        expect(result.error).toBe('User ID is required')
      })

      it('rejects empty action', async () => {
        const result = await logUserAction(testUserId1, '')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Action is required')
      })

      it('rejects whitespace-only action', async () => {
        const result = await logUserAction(testUserId1, '   ')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Action is required')
      })
    })

    describe('multiple actions', () => {
      it('logs multiple actions for same user', async () => {
        await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED)
        await logUserAction(testUserId1, USER_ACTIONS.PROFILE_UPDATED)
        await logUserAction(testUserId1, USER_ACTIONS.EMAIL_CHANGED)

        const logs = await getUserAuditLogs(testUserId1)
        expect(logs.length).toBe(3)

        // Should be in reverse chronological order
        expect(logs[0].action).toBe(USER_ACTIONS.EMAIL_CHANGED)
        expect(logs[1].action).toBe(USER_ACTIONS.PROFILE_UPDATED)
        expect(logs[2].action).toBe(USER_ACTIONS.PASSWORD_CHANGED)
      })

      it('tracks actions for different users independently', async () => {
        await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED)
        await logUserAction(testUserId2, USER_ACTIONS.PROFILE_UPDATED)

        const logs1 = await getUserAuditLogs(testUserId1)
        const logs2 = await getUserAuditLogs(testUserId2)

        expect(logs1.length).toBe(1)
        expect(logs1[0].action).toBe(USER_ACTIONS.PASSWORD_CHANGED)

        expect(logs2.length).toBe(1)
        expect(logs2[0].action).toBe(USER_ACTIONS.PROFILE_UPDATED)
      })
    })
  })

  describe('getUserAuditLogs', () => {
    beforeEach(async () => {
      // Create test data
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '1.1.1.1',
      })
      await logUserAction(testUserId1, USER_ACTIONS.PROFILE_UPDATED, {
        ipAddress: '1.1.1.2',
      })
      await logUserAction(testUserId1, USER_ACTIONS.EMAIL_CHANGED, {
        ipAddress: '1.1.1.3',
      })
    })

    it('retrieves all logs for a user', async () => {
      const logs = await getUserAuditLogs(testUserId1)

      expect(logs.length).toBe(3)
      expect(logs.every((log) => log.user_id === testUserId1))
    })

    it('filters by action type', async () => {
      const logs = await getUserAuditLogs(testUserId1, {
        action: USER_ACTIONS.PASSWORD_CHANGED,
      })

      expect(logs.length).toBe(1)
      expect(logs[0].action).toBe(USER_ACTIONS.PASSWORD_CHANGED)
      expect(logs[0].ip_address).toBe('1.1.1.1')
    })

    it('respects limit parameter', async () => {
      const logs = await getUserAuditLogs(testUserId1, { limit: 2 })

      expect(logs.length).toBe(2)
    })

    it('returns empty array for user with no logs', async () => {
      const logs = await getUserAuditLogs(testUserId2)

      expect(logs).toEqual([])
    })

    it('returns logs in reverse chronological order', async () => {
      const logs = await getUserAuditLogs(testUserId1)

      // Most recent first
      expect(logs[0].action).toBe(USER_ACTIONS.EMAIL_CHANGED)
      expect(logs[2].action).toBe(USER_ACTIONS.PASSWORD_CHANGED)

      // Verify timestamps are descending
      expect(logs[0].created_at.getTime()).toBeGreaterThanOrEqual(
        logs[1].created_at.getTime(),
      )
      expect(logs[1].created_at.getTime()).toBeGreaterThanOrEqual(
        logs[2].created_at.getTime(),
      )
    })
  })

  describe('getActionAuditLogs', () => {
    beforeEach(async () => {
      // Create test data for multiple users
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '1.1.1.1',
      })
      await logUserAction(testUserId2, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '2.2.2.2',
      })
      await logUserAction(testUserId1, USER_ACTIONS.PROFILE_UPDATED, {
        ipAddress: '1.1.1.3',
      })
    })

    it('retrieves logs for specific action across all users', async () => {
      const logs = await getActionAuditLogs(USER_ACTIONS.PASSWORD_CHANGED)

      expect(logs.length).toBe(2)
      expect(logs.every((log) => log.action === USER_ACTIONS.PASSWORD_CHANGED)).toBe(
        true,
      )

      // Should include user info
      expect(logs[0].users.email).toBeDefined()
      expect(logs[0].users.name).toBeDefined()
    })

    it('respects limit parameter', async () => {
      const logs = await getActionAuditLogs(USER_ACTIONS.PASSWORD_CHANGED, 1)

      expect(logs.length).toBe(1)
    })

    it('returns logs in reverse chronological order', async () => {
      const logs = await getActionAuditLogs(USER_ACTIONS.PASSWORD_CHANGED)

      // Most recent first (user2 was logged after user1)
      expect(logs[0].user_id).toBe(testUserId2)
      expect(logs[1].user_id).toBe(testUserId1)
    })

    it('returns empty array for action with no logs', async () => {
      const logs = await getActionAuditLogs(USER_ACTIONS.ACCOUNT_DELETED)

      expect(logs).toEqual([])
    })
  })

  describe('USER_ACTIONS constants', () => {
    it('exports standard action types', () => {
      expect(USER_ACTIONS.PASSWORD_CHANGED).toBe('password_changed')
      expect(USER_ACTIONS.EMAIL_CHANGED).toBe('email_changed')
      expect(USER_ACTIONS.PROFILE_UPDATED).toBe('profile_updated')
      expect(USER_ACTIONS.ACCOUNT_DELETED).toBe('account_deleted')
      expect(USER_ACTIONS.TWO_FACTOR_ENABLED).toBe('two_factor_enabled')
      expect(USER_ACTIONS.TWO_FACTOR_DISABLED).toBe('two_factor_disabled')
    })
  })

  describe('metadata handling', () => {
    it('stores complex metadata objects', async () => {
      const complexMetadata = {
        ipAddress: '1.2.3.4',
        userAgent: 'Test Agent',
        details: {
          nested: {
            data: 'value',
            array: [1, 2, 3],
          },
          boolean: true,
          number: 42,
        },
      }

      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, complexMetadata)

      const logs = await getUserAuditLogs(testUserId1)
      expect(logs[0].metadata).toMatchObject({
        ip_address: '1.2.3.4',
        user_agent: 'Test Agent',
        details: complexMetadata.details,
      })
    })

    it('handles null metadata gracefully', async () => {
      const result = await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, undefined)

      expect(result.success).toBe(true)

      const logs = await getUserAuditLogs(testUserId1)
      expect(logs[0].metadata).toBeNull()
    })

    it('handles empty metadata object', async () => {
      const result = await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {})

      expect(result.success).toBe(true)

      const logs = await getUserAuditLogs(testUserId1)
      expect(logs[0].metadata).toBeNull()
    })
  })

  describe('security considerations', () => {
    it('does not expose sensitive user data', async () => {
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED)

      const logs = await getUserAuditLogs(testUserId1)

      // Should not include password or other sensitive fields
      expect(logs[0]).not.toHaveProperty('password')
      expect(logs[0]).toHaveProperty('user_id')
      expect(logs[0]).toHaveProperty('action')
      expect(logs[0]).toHaveProperty('created_at')
    })

    it('timestamps are set automatically', async () => {
      const beforeLog = new Date()
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED)
      const afterLog = new Date()

      const logs = await getUserAuditLogs(testUserId1)
      const timestamp = logs[0].created_at

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime())
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime())
    })
  })

  describe('real-world scenarios', () => {
    it('tracks password change history', async () => {
      // Simulate password changes over time
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '1.1.1.1',
        details: { method: 'self-service' },
      })

      // Simulate another change from different location
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '2.2.2.2',
        details: { method: 'self-service' },
      })

      const logs = await getUserAuditLogs(testUserId1, {
        action: USER_ACTIONS.PASSWORD_CHANGED,
      })

      expect(logs.length).toBe(2)
      expect(logs[0].ip_address).toBe('2.2.2.2') // Most recent
      expect(logs[1].ip_address).toBe('1.1.1.1') // Older
    })

    it('monitors suspicious activity across users', async () => {
      // Simulate multiple password changes
      await logUserAction(testUserId1, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '1.1.1.1',
      })
      await logUserAction(testUserId2, USER_ACTIONS.PASSWORD_CHANGED, {
        ipAddress: '1.1.1.1', // Same IP - potentially suspicious
      })

      const allPasswordChanges = await getActionAuditLogs(
        USER_ACTIONS.PASSWORD_CHANGED,
      )

      expect(allPasswordChanges.length).toBe(2)
      expect(allPasswordChanges.every((log) => log.ip_address === '1.1.1.1')).toBe(
        true,
      )
    })
  })
})
