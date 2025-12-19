import '@testing-library/jest-dom'

// Load environment variables from .env.local for tests
// Use override: true to ensure .env.local takes precedence over .env
// Use quiet: true to suppress dotenv console output in test runs
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local'), override: true, quiet: true })

// Polyfill TextEncoder/TextDecoder for Prisma in Jest
// https://github.com/prisma/prisma/issues/8558
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder as typeof global.TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder

// Mock next-auth packages to avoid ESM import issues in Jest
// This allows tests to run without needing to transform the packages
jest.mock('next-auth', () => {
  const mockAuth = jest.fn(() => Promise.resolve(null))
  const mockSignIn = jest.fn()
  const mockSignOut = jest.fn()
  const mockHandlers = { GET: jest.fn(), POST: jest.fn() }

  return {
    __esModule: true,
    default: jest.fn(() => ({
      handlers: mockHandlers,
      auth: mockAuth,
      signIn: mockSignIn,
      signOut: mockSignOut,
    })),
  }
})

jest.mock('@auth/prisma-adapter', () => ({
  __esModule: true,
  PrismaAdapter: jest.fn(() => ({})),
}))

jest.mock('next-auth/providers/credentials', () => ({
  __esModule: true,
  default: jest.fn((config) => config),
}))
