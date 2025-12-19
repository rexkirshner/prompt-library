#!/usr/bin/env tsx
/**
 * Database Connection Test Script
 *
 * Run with: npm run test:db
 * Or directly: DATABASE_URL="..." npx tsx scripts/test-db.ts
 */

import { prisma } from '../lib/db/client'

async function main() {
  try {
    console.log('Testing database connection...')

    // Test connection by querying the database
    const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM users
    `

    console.log('✓ Database connection successful!')
    console.log(`✓ Users table accessible (count: ${result[0].count})`)

    // Test all tables exist
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `

    console.log('\n✓ Database tables:')
    tables.forEach(({ table_name }) => {
      console.log(`  - ${table_name}`)
    })

    console.log('\n✅ Database is ready!')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
