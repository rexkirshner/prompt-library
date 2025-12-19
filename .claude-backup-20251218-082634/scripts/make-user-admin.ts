#!/usr/bin/env tsx
import { prisma } from '../lib/db/client'

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('Usage: npx tsx scripts/make-user-admin.ts <email>')
    process.exit(1)
  }

  const user = await prisma.users.update({
    where: { email },
    data: { is_admin: true },
  })

  console.log(`✅ Made ${user.email} an admin`)
  await prisma.$disconnect()
}

main()
