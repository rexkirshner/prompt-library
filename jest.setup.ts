import '@testing-library/jest-dom'

// Polyfill TextEncoder/TextDecoder for Prisma in Jest
// https://github.com/prisma/prisma/issues/8558
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder as typeof global.TextEncoder
global.TextDecoder = TextDecoder as typeof global.TextDecoder
