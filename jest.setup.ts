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
