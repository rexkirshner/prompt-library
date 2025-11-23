/**
 * Prisma Client Singleton
 *
 * Ensures only one instance of Prisma Client exists during development (hot reload)
 * See: https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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
export type { Prompt, User, Tag, PromptEdit, AdminAction } from '@prisma/client'
export { PromptStatus, ReviewStatus } from '@prisma/client'
