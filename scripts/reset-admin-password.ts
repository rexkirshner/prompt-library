import { prisma } from '../lib/db/client'
import { hashPassword } from '../lib/auth/password'

async function resetAdminPassword() {
  const email = 'rex@rexkirshner.com'
  const newPassword = 'admin123'

  // Hash the new password
  const hashedPassword = await hashPassword(newPassword)

  // Update the password
  await prisma.users.update({
    where: { email },
    data: { password: hashedPassword }
  })

  console.log('✅ Password reset successfully!')
  console.log('')
  console.log('Login credentials:')
  console.log('Email:', email)
  console.log('Password:', newPassword)
  console.log('')
  console.log('⚠️  Please change this password after logging in!')

  process.exit(0)
}

resetAdminPassword()
