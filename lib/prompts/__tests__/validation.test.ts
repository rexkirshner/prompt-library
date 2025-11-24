/**
 * Tests for prompt submission validation utilities
 */

import {
  isValidUrl,
  generateSlug,
  isValidTag,
  normalizeTag,
  validatePromptSubmission,
  CATEGORIES,
  type PromptSubmissionData,
} from '../validation'

describe('isValidUrl', () => {
  it('should accept valid http/https URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true)
    expect(isValidUrl('http://example.com')).toBe(true)
    expect(isValidUrl('https://example.com/path')).toBe(true)
    expect(isValidUrl('https://subdomain.example.com')).toBe(true)
    expect(isValidUrl('https://example.com:8080/path?query=value')).toBe(true)
  })

  it('should reject invalid URL formats', () => {
    expect(isValidUrl('not-a-url')).toBe(false)
    expect(isValidUrl('example.com')).toBe(false)
    expect(isValidUrl('//example.com')).toBe(false)
    expect(isValidUrl('')).toBe(false)
  })

  it('should reject dangerous URL schemes (XSS prevention)', () => {
    // javascript: protocol - XSS risk
    expect(isValidUrl('javascript:alert(1)')).toBe(false)
    expect(isValidUrl('javascript:void(0)')).toBe(false)

    // data: protocol - can contain base64 encoded JavaScript
    expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)

    // file: protocol - local file access
    expect(isValidUrl('file:///etc/passwd')).toBe(false)

    // vbscript: protocol - legacy XSS vector
    expect(isValidUrl('vbscript:msgbox(1)')).toBe(false)

    // ftp: protocol - not appropriate for author links
    expect(isValidUrl('ftp://example.com')).toBe(false)
  })
})

describe('generateSlug', () => {
  it('should generate valid slugs from titles', () => {
    expect(generateSlug('Hello World')).toBe('hello-world')
    expect(generateSlug('Code Review Assistant')).toBe('code-review-assistant')
  })

  it('should handle special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world')
    expect(generateSlug('Test & Development')).toBe('test-development')
  })

  it('should handle multiple spaces', () => {
    expect(generateSlug('Multiple   Spaces')).toBe('multiple-spaces')
  })

  it('should truncate long titles', () => {
    const longTitle = 'A'.repeat(150)
    const slug = generateSlug(longTitle)
    expect(slug.length).toBeLessThanOrEqual(100)
  })
})

describe('isValidTag', () => {
  it('should accept valid tags', () => {
    expect(isValidTag('javascript')).toBe(true)
    expect(isValidTag('code-review')).toBe(true)
    expect(isValidTag('ai-prompts')).toBe(true)
    expect(isValidTag('gpt-4')).toBe(true)
  })

  it('should reject invalid tags', () => {
    expect(isValidTag('JavaScript')).toBe(false) // Uppercase
    expect(isValidTag('code review')).toBe(false) // Spaces
    expect(isValidTag('code_review')).toBe(false) // Underscores
    expect(isValidTag('')).toBe(false) // Empty
  })
})

describe('normalizeTag', () => {
  it('should normalize tags to valid format', () => {
    expect(normalizeTag('JavaScript')).toBe('javascript')
    expect(normalizeTag('Code Review')).toBe('code-review')
    expect(normalizeTag('AI Prompts')).toBe('ai-prompts')
  })

  it('should remove special characters', () => {
    expect(normalizeTag('code!review')).toBe('codereview')
    expect(normalizeTag('test & development')).toBe('test-development')
  })

  it('should handle multiple spaces', () => {
    expect(normalizeTag('multiple   spaces')).toBe('multiple-spaces')
  })
})

describe('validatePromptSubmission', () => {
  const validData: PromptSubmissionData = {
    title: 'Code Review Assistant',
    promptText: 'A'.repeat(200), // Valid length
    description: 'A helpful prompt for code reviews',
    exampleOutput: 'Sample output here',
    category: 'Coding & Development',
    tags: ['code-review', 'javascript'],
    authorName: 'John Doe',
    authorUrl: 'https://example.com',
  }

  describe('title validation', () => {
    it('should accept valid titles', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.title).toBeUndefined()
    })

    it('should reject empty title', () => {
      const result = validatePromptSubmission({ ...validData, title: '' })
      expect(result.success).toBe(false)
      expect(result.errors.title).toContain('required')
    })

    it('should reject title that is too short', () => {
      const result = validatePromptSubmission({ ...validData, title: 'Short' })
      expect(result.success).toBe(false)
      expect(result.errors.title).toContain('at least 10')
    })

    it('should reject title that is too long', () => {
      const result = validatePromptSubmission({ ...validData, title: 'A'.repeat(150) })
      expect(result.success).toBe(false)
      expect(result.errors.title).toContain('less than 100')
    })
  })

  describe('promptText validation', () => {
    it('should accept valid prompt text', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.promptText).toBeUndefined()
    })

    it('should reject empty prompt text', () => {
      const result = validatePromptSubmission({ ...validData, promptText: '' })
      expect(result.success).toBe(false)
      expect(result.errors.promptText).toContain('required')
    })

    it('should reject prompt text that is too short', () => {
      const result = validatePromptSubmission({ ...validData, promptText: 'Too short' })
      expect(result.success).toBe(false)
      expect(result.errors.promptText).toContain('at least 150')
    })

    it('should reject prompt text that is too long', () => {
      const result = validatePromptSubmission({ ...validData, promptText: 'A'.repeat(6000) })
      expect(result.success).toBe(false)
      expect(result.errors.promptText).toContain('less than 5000')
    })
  })

  describe('description validation', () => {
    it('should accept valid description', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.description).toBeUndefined()
    })

    it('should accept empty description (optional)', () => {
      const result = validatePromptSubmission({ ...validData, description: '' })
      expect(result.success).toBe(true)
      expect(result.errors.description).toBeUndefined()
    })

    it('should reject description that is too long', () => {
      const result = validatePromptSubmission({ ...validData, description: 'A'.repeat(600) })
      expect(result.success).toBe(false)
      expect(result.errors.description).toContain('less than 500')
    })
  })

  describe('exampleOutput validation', () => {
    it('should accept valid example output', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.exampleOutput).toBeUndefined()
    })

    it('should accept empty example output (optional)', () => {
      const result = validatePromptSubmission({ ...validData, exampleOutput: '' })
      expect(result.success).toBe(true)
      expect(result.errors.exampleOutput).toBeUndefined()
    })

    it('should reject example output that is too long', () => {
      const result = validatePromptSubmission({ ...validData, exampleOutput: 'A'.repeat(1500) })
      expect(result.success).toBe(false)
      expect(result.errors.exampleOutput).toContain('less than 1000')
    })
  })

  describe('category validation', () => {
    it('should accept valid category', () => {
      CATEGORIES.forEach((category) => {
        const result = validatePromptSubmission({ ...validData, category })
        expect(result.success).toBe(true)
        expect(result.errors.category).toBeUndefined()
      })
    })

    it('should reject empty category', () => {
      const result = validatePromptSubmission({ ...validData, category: '' })
      expect(result.success).toBe(false)
      expect(result.errors.category).toContain('required')
    })

    it('should reject invalid category', () => {
      const result = validatePromptSubmission({ ...validData, category: 'Invalid Category' })
      expect(result.success).toBe(false)
      expect(result.errors.category).toContain('valid category')
    })
  })

  describe('tags validation', () => {
    it('should accept valid tags', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.tags).toBeUndefined()
    })

    it('should reject empty tags array', () => {
      const result = validatePromptSubmission({ ...validData, tags: [] })
      expect(result.success).toBe(false)
      expect(result.errors.tags).toContain('at least 1')
    })

    it('should reject too many tags', () => {
      const result = validatePromptSubmission({ ...validData, tags: ['a', 'b', 'c', 'd', 'e', 'f'] })
      expect(result.success).toBe(false)
      expect(result.errors.tags).toContain('Maximum 5')
    })

    it('should reject invalid tag format', () => {
      const result = validatePromptSubmission({ ...validData, tags: ['Valid-Tag', 'Invalid Tag'] })
      expect(result.success).toBe(false)
      expect(result.errors.tags).toContain('lowercase')
    })
  })

  describe('authorName validation', () => {
    it('should accept valid author name', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.authorName).toBeUndefined()
    })

    it('should reject empty author name', () => {
      const result = validatePromptSubmission({ ...validData, authorName: '' })
      expect(result.success).toBe(false)
      expect(result.errors.authorName).toContain('required')
    })

    it('should reject author name that is too long', () => {
      const result = validatePromptSubmission({ ...validData, authorName: 'A'.repeat(150) })
      expect(result.success).toBe(false)
      expect(result.errors.authorName).toContain('less than 100')
    })
  })

  describe('authorUrl validation', () => {
    it('should accept valid author URL', () => {
      const result = validatePromptSubmission(validData)
      expect(result.success).toBe(true)
      expect(result.errors.authorUrl).toBeUndefined()
    })

    it('should accept empty author URL (optional)', () => {
      const result = validatePromptSubmission({ ...validData, authorUrl: '' })
      expect(result.success).toBe(true)
      expect(result.errors.authorUrl).toBeUndefined()
    })

    it('should reject invalid author URL', () => {
      const result = validatePromptSubmission({ ...validData, authorUrl: 'not-a-url' })
      expect(result.success).toBe(false)
      expect(result.errors.authorUrl).toContain('valid URL')
    })
  })
})
