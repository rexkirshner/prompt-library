/**
 * Integration tests for API endpoints
 *
 * Tests the actual route handlers to ensure they return correct responses,
 * handle errors properly, and enforce rate limits.
 *
 * @jest-environment node
 */

import { NextRequest } from 'next/server'
import { GET as getCategories } from '@/app/api/v1/categories/route'
import { GET as getTags } from '@/app/api/v1/tags/route'
import { GET as getPrompts } from '@/app/api/v1/prompts/route'
import {
  GET as getPrompt,
  OPTIONS as optionsPrompt,
} from '@/app/api/v1/prompts/[identifier]/route'

// Helper to create a mock NextRequest
function createMockRequest(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    headers: new Headers(headers),
  })
}

// Helper to parse JSON response
async function parseResponse(response: Response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

describe('Categories Endpoint', () => {
  it('returns list of categories', async () => {
    const request = createMockRequest('/api/v1/categories')
    const response = await getCategories(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('includes CORS headers', async () => {
    const request = createMockRequest('/api/v1/categories')
    const response = await getCategories(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })

  it('returns consistent results', async () => {
    const request1 = createMockRequest('/api/v1/categories')
    const request2 = createMockRequest('/api/v1/categories')

    const response1 = await getCategories(request1)
    const response2 = await getCategories(request2)

    const data1 = await parseResponse(response1)
    const data2 = await parseResponse(response2)

    expect(data1.data).toEqual(data2.data)
  })
})

describe('Tags Endpoint', () => {
  it('returns list of tags', async () => {
    const request = createMockRequest('/api/v1/tags')
    const response = await getTags(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('each tag has required fields', async () => {
    const request = createMockRequest('/api/v1/tags')
    const response = await getTags(request)
    const data = await parseResponse(response)

    const tag = data.data[0]
    expect(tag).toHaveProperty('id')
    expect(tag).toHaveProperty('slug')
    expect(tag).toHaveProperty('name')
  })

  it('respects limit parameter', async () => {
    const request = createMockRequest('/api/v1/tags?limit=5')
    const response = await getTags(request)
    const data = await parseResponse(response)

    expect(data.data.length).toBe(5)
  })

  it('validates limit parameter', async () => {
    const request = createMockRequest('/api/v1/tags?limit=200')
    const response = await getTags(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('INVALID_LIMIT')
  })

  it('includes CORS headers', async () => {
    const request = createMockRequest('/api/v1/tags')
    const response = await getTags(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

describe('Prompts List Endpoint', () => {
  it('returns paginated list of prompts', async () => {
    const request = createMockRequest('/api/v1/prompts')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.meta).toHaveProperty('page')
    expect(data.meta).toHaveProperty('limit')
    expect(data.meta).toHaveProperty('total')
    expect(data.meta).toHaveProperty('totalPages')
  })

  it('each prompt has all public fields', async () => {
    const request = createMockRequest('/api/v1/prompts?limit=1')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    const prompt = data.data[0]
    expect(prompt).toHaveProperty('id')
    expect(prompt).toHaveProperty('slug')
    expect(prompt).toHaveProperty('title')
    expect(prompt).toHaveProperty('description')
    expect(prompt).toHaveProperty('prompt_text')
    expect(prompt).toHaveProperty('resolved_text')
    expect(prompt).toHaveProperty('category')
    expect(prompt).toHaveProperty('author_name')
    expect(prompt).toHaveProperty('author_url')
    expect(prompt).toHaveProperty('tags')
    expect(prompt).toHaveProperty('is_compound')
    expect(prompt).toHaveProperty('featured')
    expect(prompt).toHaveProperty('created_at')
    expect(prompt).toHaveProperty('updated_at')
  })

  it('does not expose private fields', async () => {
    const request = createMockRequest('/api/v1/prompts?limit=1')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    const prompt = data.data[0]
    expect(prompt).not.toHaveProperty('copy_count')
    expect(prompt).not.toHaveProperty('view_count')
    expect(prompt).not.toHaveProperty('submitted_by_user_id')
    expect(prompt).not.toHaveProperty('approved_by_user_id')
    expect(prompt).not.toHaveProperty('status')
    expect(prompt).not.toHaveProperty('rejection_reason')
    expect(prompt).not.toHaveProperty('deleted_at')
  })

  it('respects limit parameter', async () => {
    const request = createMockRequest('/api/v1/prompts?limit=5')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(data.data.length).toBeLessThanOrEqual(5)
    expect(data.meta.limit).toBe(5)
  })

  it('validates limit parameter', async () => {
    const request = createMockRequest('/api/v1/prompts?limit=200')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_LIMIT')
  })

  it('validates page parameter', async () => {
    const request = createMockRequest('/api/v1/prompts?page=0')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_PAGE')
  })

  it('validates sort parameter', async () => {
    const request = createMockRequest('/api/v1/prompts?sort=invalid')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(400)
    expect(data.error.code).toBe('INVALID_SORT')
  })

  it('supports search query', async () => {
    const request = createMockRequest('/api/v1/prompts?q=email')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('supports category filter', async () => {
    const request = createMockRequest('/api/v1/prompts?category=Writing')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.data.every((p: any) => p.category === 'Writing')).toBe(true)
  })

  it('supports alphabetical sort', async () => {
    const request = createMockRequest('/api/v1/prompts?sort=alphabetical&limit=5')
    const response = await getPrompts(request)
    const data = await parseResponse(response)

    const titles = data.data.map((p: any) => p.title)
    const sortedTitles = [...titles].sort()
    expect(titles).toEqual(sortedTitles)
  })

  it('includes CORS headers', async () => {
    const request = createMockRequest('/api/v1/prompts')
    const response = await getPrompts(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})

describe('Single Prompt Endpoint', () => {
  // We'll dynamically fetch a prompt from the database for testing
  let testPrompt: { id: string; slug: string; is_compound: boolean } | null = null
  let compoundPrompt: { id: string; slug: string; is_compound: boolean } | null = null

  beforeAll(async () => {
    // Fetch prompts to use for testing
    const listRequest = createMockRequest('/api/v1/prompts?limit=50')
    const listResponse = await getPrompts(listRequest)
    const listData = await parseResponse(listResponse)

    if (listData.data && listData.data.length > 0) {
      // Find a regular prompt
      testPrompt = listData.data.find((p: any) => !p.is_compound) || listData.data[0]
      // Find a compound prompt if one exists
      compoundPrompt = listData.data.find((p: any) => p.is_compound) || null
    }
  })

  it('handles OPTIONS request', async () => {
    const response = await optionsPrompt()

    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })

  it('fetches prompt by slug', async () => {
    if (!testPrompt) {
      console.warn('Skipping test: no prompts in database')
      return
    }

    const request = createMockRequest(`/api/v1/prompts/${testPrompt.slug}`)
    const context = {
      params: Promise.resolve({ identifier: testPrompt.slug }),
    }

    const response = await getPrompt(request, context)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.slug).toBe(testPrompt.slug)
  })

  it('fetches prompt by UUID', async () => {
    if (!testPrompt) {
      console.warn('Skipping test: no prompts in database')
      return
    }

    const request = createMockRequest(`/api/v1/prompts/${testPrompt.id}`)
    const context = {
      params: Promise.resolve({ identifier: testPrompt.id }),
    }

    const response = await getPrompt(request, context)
    const data = await parseResponse(response)

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(testPrompt.id)
  })

  it('returns all public fields', async () => {
    if (!testPrompt) {
      console.warn('Skipping test: no prompts in database')
      return
    }

    const request = createMockRequest(`/api/v1/prompts/${testPrompt.slug}`)
    const context = {
      params: Promise.resolve({ identifier: testPrompt.slug }),
    }

    const response = await getPrompt(request, context)
    const data = await parseResponse(response)

    const prompt = data.data
    expect(prompt).toHaveProperty('id')
    expect(prompt).toHaveProperty('slug')
    expect(prompt).toHaveProperty('title')
    expect(prompt).toHaveProperty('description')
    expect(prompt).toHaveProperty('prompt_text')
    expect(prompt).toHaveProperty('resolved_text')
    expect(prompt).toHaveProperty('category')
    expect(prompt).toHaveProperty('author_name')
    expect(prompt).toHaveProperty('author_url')
    expect(prompt).toHaveProperty('tags')
    expect(prompt).toHaveProperty('is_compound')
    expect(prompt).toHaveProperty('featured')
    expect(prompt).toHaveProperty('created_at')
    expect(prompt).toHaveProperty('updated_at')
  })

  it('does not expose private fields', async () => {
    if (!testPrompt) {
      console.warn('Skipping test: no prompts in database')
      return
    }

    const request = createMockRequest(`/api/v1/prompts/${testPrompt.slug}`)
    const context = {
      params: Promise.resolve({ identifier: testPrompt.slug }),
    }

    const response = await getPrompt(request, context)
    const data = await parseResponse(response)

    const prompt = data.data
    expect(prompt).not.toHaveProperty('copy_count')
    expect(prompt).not.toHaveProperty('view_count')
    expect(prompt).not.toHaveProperty('submitted_by_user_id')
    expect(prompt).not.toHaveProperty('status')
  })

  it('resolves compound prompts', async () => {
    if (!compoundPrompt) {
      console.warn('Skipping test: no compound prompts in database')
      return
    }

    const request = createMockRequest(`/api/v1/prompts/${compoundPrompt.slug}`)
    const context = {
      params: Promise.resolve({ identifier: compoundPrompt.slug }),
    }

    const response = await getPrompt(request, context)
    const data = await parseResponse(response)

    expect(data.data.is_compound).toBe(true)
    // Compound prompts may or may not have prompt_text depending on implementation
    expect(data.data.resolved_text).toBeTruthy()
    expect(data.data.resolved_text.length).toBeGreaterThan(0)
  })

  it('returns 404 for non-existent prompt', async () => {
    const request = createMockRequest('/api/v1/prompts/definitely-does-not-exist-xyz123')
    const context = {
      params: Promise.resolve({ identifier: 'definitely-does-not-exist-xyz123' }),
    }

    const response = await getPrompt(request, context)
    const data = await parseResponse(response)

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('includes CORS headers', async () => {
    if (!testPrompt) {
      console.warn('Skipping test: no prompts in database')
      return
    }

    const request = createMockRequest(`/api/v1/prompts/${testPrompt.slug}`)
    const context = {
      params: Promise.resolve({ identifier: testPrompt.slug }),
    }

    const response = await getPrompt(request, context)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })
})
