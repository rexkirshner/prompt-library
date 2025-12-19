import { prisma } from '../lib/db/client'

async function checkAdmins() {
  const admins = await prisma.users.findMany({
    where: { is_admin: true },
    select: { email: true, name: true }
  })

  console.log('Admin accounts:', JSON.stringify(admins, null, 2))
  process.exit(0)
}

checkAdmins()
