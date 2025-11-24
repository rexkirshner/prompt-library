/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of Prisma Client exists during development (hot reload)
 * See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  // Configure connection pool based on environment
  const isDevelopment = process.env.NODE_ENV === 'development'
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Explicit password configuration to avoid SASL issues
    ssl: false,
    // Connection pool configuration
    max: isDevelopment ? 5 : 20, // Maximum connections (5 for dev, 20 for prod)
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
    connectionTimeoutMillis: 10000, // Timeout after 10 seconds if can't connect
    // Allow graceful shutdown
    allowExitOnIdle: isDevelopment,
  })
  const adapter = new PrismaPg(pool)

  return new PrismaClient({
    adapter,
    log: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined
} & typeof global

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export { prisma }

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma
}

// Export Prisma types for convenience
export type { prompts, users, tags, prompt_edits, admin_actions } from '@prisma/client'
export { PromptStatus, ReviewStatus } from '@prisma/client'
