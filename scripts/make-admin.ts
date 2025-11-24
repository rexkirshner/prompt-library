/**
 * Make User Admin Script
 *
 * Updates a user to have admin privileges.
 * Usage: tsx scripts/make-admin.ts <email>
 */

import { prisma } from '../lib/db/client'

async function makeAdmin(email: string) {
  try {
    console.log(`\nLooking for user with email: ${email}...`)

    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      console.error(`❌ User not found: ${email}`)
      process.exit(1)
    }

    if (user.is_admin) {
      console.log(`✅ User is already an admin: ${email}`)
      process.exit(0)
    }

    // Update user to admin
    await prisma.users.update({
      where: { email },
      data: { is_admin: true },
    })

    console.log(`✅ Successfully granted admin privileges to: ${email}`)
    console.log(`   User ID: ${user.id}`)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Get email from command line args
const email = process.argv[2]

if (!email) {
  console.error('Usage: tsx scripts/make-admin.ts <email>')
  process.exit(1)
}

makeAdmin(email)
