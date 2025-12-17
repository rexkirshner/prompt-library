/**
 * Bulk Import API Endpoint Tests
 *
 * Integration tests for the POST /api/admin/bulk-import endpoint.
 * Tests authentication, validation, and import functionality.
 *
 * @jest-environment node
 * @module lib/admin/bulk-import/__tests__/api.test
 */

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/bulk-import/route'
import { prisma } from '@/lib/db/client'

// Mock the auth module
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
}))

// Mock the audit module to avoid actual logging
jest.mock('@/lib/audit', () => ({
  logUserAction: jest.fn().mockResolvedValue(undefined),
}))

import { auth } from '@/lib/auth'

// Helper to create a mock NextRequest
function createMockRequest(body: unknown) {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body)
  return new NextRequest(new URL('http://localhost:3000/api/admin/bulk-import'), {
    method: 'POST',
    body: bodyString,
    headers: new Headers({
      'Content-Type': 'application/json',
    }),
  })
}

// Helper to parse JSON response
async function parseResponse(response: Response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

describe('POST /api/admin/bulk-import', () => {
  let testAdminId: string
  let createdPromptIds: string[] = []
  let createdTagIds: string[] = []

  beforeAll(async () => {
    // Create a test admin user
    const adminId = crypto.randomUUID()
    const admin = await prisma.users.create({
      data: {
        id: adminId,
        email: 'bulk-import-api-test@example.com',
        password: 'test-hash',
        name: 'Bulk Import API Test Admin',
        is_admin: true,
      },
    })
    testAdminId = admin.id
  })

  afterEach(async () => {
    // Clean up created prompts and their tag associations
    if (createdPromptIds.length > 0) {
      await prisma.prompt_tags.deleteMany({
        where: { prompt_id: { in: createdPromptIds } },
      })
      await prisma.prompts.deleteMany({
        where: { id: { in: createdPromptIds } },
      })
    }
    // Clean up created tags
    if (createdTagIds.length > 0) {
      await prisma.tags.deleteMany({
        where: { id: { in: createdTagIds } },
      })
    }
    createdPromptIds = []
    createdTagIds = []
    jest.clearAllMocks()
  })

  afterAll(async () => {
    // Clean up test admin user
    await prisma.users.delete({
      where: { id: testAdminId },
    })
  })

  describe('authentication', () => {
    it('returns 401 when not authenticated', async () => {
      ;(auth as jest.Mock).mockResolvedValue(null)

      const request = createMockRequest({
        prompts: [{ title: 'Test', prompt_text: 'Text', category: 'Testing' }],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('returns 401 when user is not admin', async () => {
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: testAdminId, isAdmin: false },
      })

      const request = createMockRequest({
        prompts: [{ title: 'Test', prompt_text: 'Text', category: 'Testing' }],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('validation', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: testAdminId, isAdmin: true },
      })
    })

    it('returns 400 for empty body', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/bulk-import'),
        {
          method: 'POST',
          body: '',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
        }
      )

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('empty')
    })

    it('returns 400 for invalid JSON', async () => {
      const request = new NextRequest(
        new URL('http://localhost:3000/api/admin/bulk-import'),
        {
          method: 'POST',
          body: '{ invalid json }',
          headers: new Headers({
            'Content-Type': 'application/json',
          }),
        }
      )

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details.some((d: string) => d.includes('Invalid JSON'))).toBe(true)
    })

    it('returns 400 for missing prompts array', async () => {
      const request = createMockRequest({})

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 for empty prompts array', async () => {
      const request = createMockRequest({ prompts: [] })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
    })

    it('returns 400 for missing required fields', async () => {
      const request = createMockRequest({
        prompts: [{ title: 'Test' }], // Missing prompt_text and category
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(400)
      expect(data.error).toBe('Validation failed')
      expect(data.details.length).toBeGreaterThan(0)
    })
  })

  describe('successful import', () => {
    beforeEach(() => {
      ;(auth as jest.Mock).mockResolvedValue({
        user: { id: testAdminId, isAdmin: true },
      })
    })

    it('imports a single prompt successfully', async () => {
      const request = createMockRequest({
        prompts: [
          {
            title: 'API Test Prompt',
            prompt_text: 'This is a test prompt from API',
            category: 'Testing',
          },
        ],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.total).toBe(1)
      expect(data.created).toBe(1)
      expect(data.results[0].success).toBe(true)
      expect(data.results[0].id).toBeDefined()

      // Track for cleanup
      if (data.results[0].id) {
        createdPromptIds.push(data.results[0].id)
      }
    })

    it('imports multiple prompts successfully', async () => {
      const request = createMockRequest({
        prompts: [
          {
            title: 'API Multi Test 1',
            prompt_text: 'First test prompt',
            category: 'Testing',
          },
          {
            title: 'API Multi Test 2',
            prompt_text: 'Second test prompt',
            category: 'Development',
          },
        ],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.total).toBe(2)
      expect(data.created).toBe(2)

      // Track for cleanup
      data.results.forEach((r: { id?: string }) => {
        if (r.id) createdPromptIds.push(r.id)
      })
    })

    it('handles tags correctly', async () => {
      const uniqueTag = 'api-test-tag-' + Date.now()
      const request = createMockRequest({
        prompts: [
          {
            title: 'API Tag Test',
            prompt_text: 'Testing tags',
            category: 'Testing',
            tags: [uniqueTag],
          },
        ],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.created).toBe(1)

      // Verify tags were created
      const prompt = await prisma.prompts.findUnique({
        where: { id: data.results[0].id },
        include: { prompt_tags: { include: { tags: true } } },
      })

      expect(prompt?.prompt_tags).toHaveLength(1)
      expect(prompt?.prompt_tags[0].tags.name).toBe(uniqueTag)

      // Track for cleanup
      if (data.results[0].id) {
        createdPromptIds.push(data.results[0].id)
      }
      if (prompt?.prompt_tags[0]?.tag_id) {
        createdTagIds.push(prompt.prompt_tags[0].tag_id)
      }
    })

    it('skips duplicates and reports correctly', async () => {
      // Create existing prompt
      const existingSlug = 'api-existing-prompt-' + Date.now()
      const existing = await prisma.prompts.create({
        data: {
          id: crypto.randomUUID(),
          title: 'Existing Prompt',
          slug: existingSlug,
          prompt_text: 'Existing text',
          category: 'Testing',
          author_name: 'Original',
          status: 'APPROVED',
          is_compound: false,
          submitted_by_user_id: testAdminId,
          updated_at: new Date(),
        },
      })
      createdPromptIds.push(existing.id)

      const request = createMockRequest({
        prompts: [
          {
            title: 'Different Title',
            prompt_text: 'Different text',
            category: 'Testing',
            slug: existingSlug, // Same slug
          },
        ],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true) // Overall success even with skips
      expect(data.created).toBe(0)
      expect(data.skipped).toBe(1)
      expect(data.results[0].skipped).toBe(true)
    })

    it('returns correct message format', async () => {
      const request = createMockRequest({
        prompts: [
          {
            title: 'Message Test',
            prompt_text: 'Testing message',
            category: 'Testing',
          },
        ],
      })

      const response = await POST(request)
      const data = await parseResponse(response)

      expect(data.message).toContain('1 prompt')
      expect(data.message).toContain('created')

      if (data.results[0].id) {
        createdPromptIds.push(data.results[0].id)
      }
    })
  })
})
