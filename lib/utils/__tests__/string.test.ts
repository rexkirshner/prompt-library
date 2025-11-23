import { slugify, truncate, capitalize } from '../string'

describe('slugify', () => {
  it('converts text to lowercase slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('removes special characters', () => {
    expect(slugify('Hello & Goodbye!')).toBe('hello-goodbye')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('Code Review Best Practices')).toBe('code-review-best-practices')
  })

  it('handles multiple consecutive spaces', () => {
    expect(slugify('Hello    World')).toBe('hello-world')
  })

  it('removes leading and trailing hyphens', () => {
    expect(slugify('  Hello World  ')).toBe('hello-world')
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('handles string with only special characters', () => {
    expect(slugify('!@#$%^&*()')).toBe('')
  })
})

describe('truncate', () => {
  it('truncates text longer than maxLength', () => {
    expect(truncate('This is a long text', 10)).toBe('This is a...')
  })

  it('does not truncate text shorter than maxLength', () => {
    const text = 'Short'
    expect(truncate(text, 10)).toBe(text)
  })

  it('handles text exactly at maxLength', () => {
    const text = '1234567890'
    expect(truncate(text, 10)).toBe(text)
  })

  it('trims whitespace before adding ellipsis', () => {
    expect(truncate('Hello World Test', 11)).toBe('Hello World...')
  })
})

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('lowercases remaining letters', () => {
    expect(capitalize('HELLO')).toBe('Hello')
  })

  it('handles mixed case', () => {
    expect(capitalize('hELLo WoRLD')).toBe('Hello world')
  })

  it('handles empty string', () => {
    expect(capitalize('')).toBe('')
  })

  it('handles single character', () => {
    expect(capitalize('a')).toBe('A')
  })
})
