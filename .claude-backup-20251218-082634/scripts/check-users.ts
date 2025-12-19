#!/usr/bin/env tsx
import { prisma } from '../lib/db/client'

async function main() {
  const users = await prisma.users.findMany({
    select: { id: true, email: true, is_admin: true },
  })
  console.log('Users in database:', users.length)
  users.forEach(u => console.log(`  - ${u.email} (admin: ${u.is_admin})`))
  await prisma.$disconnect()
}

main()
