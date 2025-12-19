/**
 * Sitemap Generator Tests
 *
 * Tests for modular sitemap generation utilities.
 * Ensures correct URL structure, priorities, and frequencies.
 */

import {
  generateStaticSitemap,
  generatePromptsSitemap,
  generateCombinedSitemap,
  generateSitemapIndex,
} from '../sitemaps'
import { prisma } from '@/lib/db/client'

// Mock Prisma client
jest.mock('@/lib/db/client', () => ({
  prisma: {
    prompts: {
      findMany: jest.fn(),
    },
  },
}))

// Mock URL utility
jest.mock('@/lib/utils/url', () => ({
  getBaseUrl: jest.fn(() => 'https://test.example.com'),
}))

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    child: () => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }),
  },
}))

describe('generateStaticSitemap', () => {
  const baseUrl = 'https://test.example.com'

  it('returns all static pages', () => {
    const sitemap = generateStaticSitemap(baseUrl)

    expect(sitemap).toHaveLength(5)
    expect(sitemap.map((entry) => entry.url)).toEqual([
      'https://test.example.com',
      'https://test.example.com/prompts',
      'https://test.example.com/submit',
      'https://test.example.com/privacy',
      'https://test.example.com/terms',
    ])
  })

  it('sets correct priorities', () => {
    const sitemap = generateStaticSitemap(baseUrl)

    expect(sitemap[0].priority).toBe(1.0) // Homepage highest
    expect(sitemap[1].priority).toBe(0.9) // Browse page
    expect(sitemap[2].priority).toBe(0.8) // Submit
    expect(sitemap[3].priority).toBe(0.5) // Privacy
    expect(sitemap[4].priority).toBe(0.5) // Terms
  })

  it('sets correct change frequencies', () => {
    const sitemap = generateStaticSitemap(baseUrl)

    expect(sitemap[0].changeFrequency).toBe('daily') // Homepage
    expect(sitemap[1].changeFrequency).toBe('daily') // Browse
    expect(sitemap[2].changeFrequency).toBe('monthly') // Submit
    expect(sitemap[3].changeFrequency).toBe('monthly') // Privacy
    expect(sitemap[4].changeFrequency).toBe('monthly') // Terms
  })

  it('includes lastModified dates', () => {
    const sitemap = generateStaticSitemap(baseUrl)

    sitemap.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date)
    })
  })
})

describe('generatePromptsSitemap', () => {
  const baseUrl = 'https://test.example.com'
  const mockPrompts = [
    {
      slug: 'test-prompt-1',
      updated_at: new Date('2024-01-01'),
    },
    {
      slug: 'test-prompt-2',
      updated_at: new Date('2024-01-02'),
    },
    {
      slug: 'test-prompt-3',
      updated_at: new Date('2024-01-03'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('generates entries for all approved prompts', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generatePromptsSitemap(baseUrl)

    expect(sitemap).toHaveLength(3)
    expect(sitemap.map((entry) => entry.url)).toEqual([
      'https://test.example.com/prompts/test-prompt-1',
      'https://test.example.com/prompts/test-prompt-2',
      'https://test.example.com/prompts/test-prompt-3',
    ])
  })

  it('uses prompt updated_at for lastModified', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generatePromptsSitemap(baseUrl)

    expect(sitemap[0].lastModified).toEqual(new Date('2024-01-01'))
    expect(sitemap[1].lastModified).toEqual(new Date('2024-01-02'))
    expect(sitemap[2].lastModified).toEqual(new Date('2024-01-03'))
  })

  it('sets weekly change frequency for prompts', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generatePromptsSitemap(baseUrl)

    sitemap.forEach((entry) => {
      expect(entry.changeFrequency).toBe('weekly')
    })
  })

  it('sets 0.7 priority for prompts', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generatePromptsSitemap(baseUrl)

    sitemap.forEach((entry) => {
      expect(entry.priority).toBe(0.7)
    })
  })

  it('queries only approved, non-deleted prompts', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    await generatePromptsSitemap(baseUrl)

    expect(prisma.prompts.findMany).toHaveBeenCalledWith({
      where: {
        status: 'APPROVED',
        deleted_at: null,
      },
      select: {
        slug: true,
        updated_at: true,
      },
      orderBy: {
        updated_at: 'desc',
      },
    })
  })

  it('returns empty array if database unavailable', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockRejectedValue(
      new Error('Database unavailable')
    )

    const sitemap = await generatePromptsSitemap(baseUrl)

    expect(sitemap).toEqual([])
  })

  it('handles empty prompt list', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue([])

    const sitemap = await generatePromptsSitemap(baseUrl)

    expect(sitemap).toEqual([])
  })
})

describe('generateCombinedSitemap', () => {
  const mockPrompts = [
    {
      slug: 'test-prompt-1',
      updated_at: new Date('2024-01-01'),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('combines static and prompt pages', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generateCombinedSitemap()

    // 5 static pages + 1 prompt page
    expect(sitemap).toHaveLength(6)
  })

  it('places static pages first', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generateCombinedSitemap()

    // First 5 should be static pages
    expect(sitemap[0].url).toBe('https://test.example.com')
    expect(sitemap[1].url).toBe('https://test.example.com/prompts')
    expect(sitemap[2].url).toBe('https://test.example.com/submit')
    expect(sitemap[3].url).toBe('https://test.example.com/privacy')
    expect(sitemap[4].url).toBe('https://test.example.com/terms')
  })

  it('appends prompt pages after static', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockResolvedValue(mockPrompts)

    const sitemap = await generateCombinedSitemap()

    // 6th entry should be prompt
    expect(sitemap[5].url).toBe('https://test.example.com/prompts/test-prompt-1')
  })

  it('works with database unavailable', async () => {
    ;(prisma.prompts.findMany as jest.Mock).mockRejectedValue(
      new Error('Database error')
    )

    const sitemap = await generateCombinedSitemap()

    // Should still have 5 static pages
    expect(sitemap).toHaveLength(5)
  })
})

describe('generateSitemapIndex', () => {
  const baseUrl = 'https://test.example.com'

  it('returns sitemap index structure', () => {
    const index = generateSitemapIndex(baseUrl)

    expect(index.sitemaps).toHaveLength(2)
  })

  it('includes static sitemap URL', () => {
    const index = generateSitemapIndex(baseUrl)

    expect(index.sitemaps[0].url).toBe('https://test.example.com/sitemap-static.xml')
  })

  it('includes prompts sitemap URL', () => {
    const index = generateSitemapIndex(baseUrl)

    expect(index.sitemaps[1].url).toBe(
      'https://test.example.com/sitemap-prompts.xml'
    )
  })

  it('includes lastModified dates', () => {
    const index = generateSitemapIndex(baseUrl)

    index.sitemaps.forEach((sitemap) => {
      expect(sitemap.lastModified).toBeInstanceOf(Date)
    })
  })
})
