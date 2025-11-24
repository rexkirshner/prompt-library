/**
 * Tests for authentication validation utilities
 */

import {
  isValidEmail,
  validatePassword,
  validateSignUpForm,
  validateSignInForm,
  type SignUpFormData,
  type SignInFormData,
} from '../validation'

describe('isValidEmail', () => {
  it('should accept valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true)
    expect(isValidEmail('test.user@example.co.uk')).toBe(true)
    expect(isValidEmail('user+tag@example.com')).toBe(true)
  })

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('@example.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
    expect(isValidEmail('user @example.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('should accept valid passwords', () => {
    const result = validatePassword('Password123')
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject passwords that are too short', () => {
    const result = validatePassword('Pass1')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('at least 8 characters')
  })

  it('should reject passwords without uppercase letters', () => {
    const result = validatePassword('password123')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('uppercase letter')
  })

  it('should reject passwords without lowercase letters', () => {
    const result = validatePassword('PASSWORD123')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('lowercase letter')
  })

  it('should reject passwords without numbers', () => {
    const result = validatePassword('PasswordABC')
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('number')
  })
})

describe('validateSignUpForm', () => {
  const validFormData: SignUpFormData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  }

  it('should accept valid form data', () => {
    const result = validateSignUpForm(validFormData)
    expect(result.success).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should reject empty name', () => {
    const result = validateSignUpForm({ ...validFormData, name: '' })
    expect(result.success).toBe(false)
    expect(result.errors.name).toBe('Name is required')
  })

  it('should reject name that is too short', () => {
    const result = validateSignUpForm({ ...validFormData, name: 'A' })
    expect(result.success).toBe(false)
    expect(result.errors.name).toContain('at least 2 characters')
  })

  it('should reject name that is too long', () => {
    const longName = 'A'.repeat(101)
    const result = validateSignUpForm({ ...validFormData, name: longName })
    expect(result.success).toBe(false)
    expect(result.errors.name).toContain('less than 100 characters')
  })

  it('should reject invalid email', () => {
    const result = validateSignUpForm({ ...validFormData, email: 'invalid' })
    expect(result.success).toBe(false)
    expect(result.errors.email).toContain('valid email')
  })

  it('should reject weak password', () => {
    const result = validateSignUpForm({ ...validFormData, password: 'weak' })
    expect(result.success).toBe(false)
    expect(result.errors.password).toBeDefined()
  })

  it('should reject mismatched passwords', () => {
    const result = validateSignUpForm({
      ...validFormData,
      confirmPassword: 'DifferentPassword123',
    })
    expect(result.success).toBe(false)
    expect(result.errors.confirmPassword).toContain('do not match')
  })

  it('should trim whitespace from name and email', () => {
    const result = validateSignUpForm({
      ...validFormData,
      name: '  Test User  ',
      email: '  test@example.com  ',
    })
    expect(result.success).toBe(true)
  })
})

describe('validateSignInForm', () => {
  const validFormData: SignInFormData = {
    email: 'test@example.com',
    password: 'Password123',
  }

  it('should accept valid form data', () => {
    const result = validateSignInForm(validFormData)
    expect(result.success).toBe(true)
    expect(Object.keys(result.errors)).toHaveLength(0)
  })

  it('should reject empty email', () => {
    const result = validateSignInForm({ ...validFormData, email: '' })
    expect(result.success).toBe(false)
    expect(result.errors.email).toBe('Email is required')
  })

  it('should reject invalid email', () => {
    const result = validateSignInForm({ ...validFormData, email: 'invalid' })
    expect(result.success).toBe(false)
    expect(result.errors.email).toContain('valid email')
  })

  it('should reject empty password', () => {
    const result = validateSignInForm({ ...validFormData, password: '' })
    expect(result.success).toBe(false)
    expect(result.errors.password).toBe('Password is required')
  })

  it('should accept any non-empty password for sign-in', () => {
    // Sign-in doesn't validate password strength, only that it exists
    const result = validateSignInForm({ ...validFormData, password: 'weak' })
    expect(result.success).toBe(true)
  })
})
