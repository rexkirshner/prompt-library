/**
 * Authentication Form Validation
 *
 * Client and server-side validation for authentication forms.
 * Provides type-safe validation with clear error messages.
 */

export interface SignUpFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface SignInFormData {
  email: string
  password: string
}

export interface ValidationResult {
  success: boolean
  errors: Record<string, string>
}

/**
 * Password validation rules
 */
const PASSWORD_MIN_LENGTH = 8
const PASSWORD_REQUIREMENTS = {
  minLength: PASSWORD_MIN_LENGTH,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false, // Optional for MVP
}

/**
 * Validate email format using regex
 *
 * @param email - The email address to validate
 * @returns true if email format is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidEmail('user@example.com') // true
 * isValidEmail('invalid-email') // false
 * isValidEmail('') // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password against security requirements
 *
 * @param password - The password to validate
 * @returns Object with valid boolean and array of error messages
 *
 * @example
 * ```typescript
 * validatePassword('weak')
 * // { valid: false, errors: ['Password must be at least 8 characters'] }
 *
 * validatePassword('StrongPass1')
 * // { valid: true, errors: [] }
 * ```
 */
export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`,
    )
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecial &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validate sign-up form data
 *
 * @param data - Sign-up form data including name, email, password, confirmPassword
 * @returns ValidationResult with success boolean and field errors
 *
 * @example
 * ```typescript
 * const result = validateSignUpForm({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'SecurePass1',
 *   confirmPassword: 'SecurePass1'
 * })
 * // { success: true, errors: {} }
 * ```
 */
export function validateSignUpForm(data: SignUpFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Name validation
  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required'
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters'
  } else if (data.name.trim().length > 100) {
    errors.name = 'Name must be less than 100 characters'
  }

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = 'Please enter a valid email address'
  }

  // Password validation
  if (!data.password) {
    errors.password = 'Password is required'
  } else {
    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.valid) {
      errors.password = passwordValidation.errors[0] // Show first error
    }
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate sign-in form data
 *
 * @param data - Sign-in form data including email and password
 * @returns ValidationResult with success boolean and field errors
 *
 * @example
 * ```typescript
 * const result = validateSignInForm({
 *   email: 'user@example.com',
 *   password: 'mypassword'
 * })
 * // { success: true, errors: {} }
 * ```
 */
export function validateSignInForm(data: SignInFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Email validation
  if (!data.email || data.email.trim().length === 0) {
    errors.email = 'Email is required'
  } else if (!isValidEmail(data.email.trim())) {
    errors.email = 'Please enter a valid email address'
  }

  // Password validation (just check if provided)
  if (!data.password || data.password.length === 0) {
    errors.password = 'Password is required'
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  }
}
