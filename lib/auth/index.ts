/**
 * Authentication Module
 *
 * Exports authentication functions and utilities.
 * Use these functions throughout the application for auth-related operations.
 */

import NextAuth from 'next-auth'
import { authConfig } from './config'

// Import types to ensure they're included
import './types'

// Initialize NextAuth with our configuration
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export utility functions
export {
  getSession,
  getCurrentUser,
  requireAuth,
  requireAdmin,
  checkIsAdmin,
} from './utils'

// Export password utilities
export { hashPassword, verifyPassword } from './password'

// Export types for convenience
export type { Session } from 'next-auth'
