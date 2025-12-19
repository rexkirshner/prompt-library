#!/usr/bin/env tsx
/**
 * Test Invite Flow
 *
 * Creates a test invite code and displays the signup URL for manual testing.
 */

import { prisma } from '../lib/db/client'
import { createInviteCode } from '../lib/invites'

async function main() {
  console.log('🧪 Testing Invite Flow\n')

  try {
    // Get the first admin user
    const admin = await prisma.users.findFirst({
      where: { is_admin: true },
    })

    if (!admin) {
      console.error('❌ No admin user found. Run npm run admin:create-first first.')
      process.exit(1)
    }

    console.log(`✅ Found admin: ${admin.email}`)

    // Create an invite code
    const baseUrl = 'http://localhost:3001'
    const result = await createInviteCode(admin.id, baseUrl)

    if (!result.success) {
      console.error('❌ Failed to create invite:', result.error)
      process.exit(1)
    }

    console.log('\n✅ Created invite code:')
    console.log(`   Code: ${result.inviteCode}`)
    console.log(`   URL:  ${result.inviteUrl}`)

    console.log('\n📋 Test Steps:')
    console.log('   1. Copy the URL above')
    console.log('   2. Open it in your browser')
    console.log('   3. Fill out the signup form')
    console.log('   4. Verify account creation succeeds')
    console.log('   5. Try using the same invite URL again')
    console.log('   6. Verify it shows "already used" error\n')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
