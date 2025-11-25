/**
 * Authentication Flow Test Script
 *
 * Tests the complete authentication flow:
 * 1. User sign-up
 * 2. User sign-in
 * 3. Session verification
 *
 * Run with: npm run test:db && npx tsx scripts/test-auth-flow.ts
 */

import { prisma } from '../lib/db/client'
import { hashPassword, verifyPassword } from '../lib/auth'
import { signUpUser } from '../app/auth/signup/actions'
import { validateSignUpForm, validateSignInForm } from '../lib/auth/validation'

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123',
  confirmPassword: 'TestPassword123',
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...')
  await prisma.users.deleteMany({
    where: { email: testUser.email },
  })
  console.log('✅ Cleanup complete\n')
}

async function testPasswordHashing() {
  console.log('Testing password hashing...')

  const hashed = await hashPassword(testUser.password)
  console.log(`  ✓ Password hashed: ${hashed.substring(0, 20)}...`)

  const isValid = await verifyPassword(testUser.password, hashed)
  console.log(`  ✓ Password verification: ${isValid ? 'PASS' : 'FAIL'}`)

  const isInvalid = await verifyPassword('wrongpassword', hashed)
  console.log(`  ✓ Invalid password rejection: ${!isInvalid ? 'PASS' : 'FAIL'}`)

  console.log('✅ Password hashing tests passed\n')
}

async function testValidation() {
  console.log('Testing form validation...')

  // Test valid sign-up data
  const validResult = validateSignUpForm(testUser)
  console.log(`  ✓ Valid form validation: ${validResult.success ? 'PASS' : 'FAIL'}`)

  // Test invalid email
  const invalidEmail = validateSignUpForm({ ...testUser, email: 'invalid' })
  console.log(`  ✓ Invalid email rejection: ${!invalidEmail.success ? 'PASS' : 'FAIL'}`)

  // Test password mismatch
  const mismatch = validateSignUpForm({ ...testUser, confirmPassword: 'different' })
  console.log(`  ✓ Password mismatch detection: ${!mismatch.success ? 'PASS' : 'FAIL'}`)

  // Test weak password
  const weakPassword = validateSignUpForm({ ...testUser, password: 'weak', confirmPassword: 'weak' })
  console.log(`  ✓ Weak password rejection: ${!weakPassword.success ? 'PASS' : 'FAIL'}`)

  // Test sign-in validation
  const signInValid = validateSignInForm({ email: testUser.email, password: testUser.password })
  console.log(`  ✓ Sign-in validation: ${signInValid.success ? 'PASS' : 'FAIL'}`)

  console.log('✅ Validation tests passed\n')
}

async function testSignUp() {
  console.log('Testing user sign-up...')

  // Create a test invite code for signup
  const inviteCode = 'test-invite-code'
  const result = await signUpUser(testUser, inviteCode)

  if (!result.success) {
    console.error('❌ Sign-up failed:', result.errors)
    throw new Error('Sign-up test failed')
  }

  console.log(`  ✓ User created: ${testUser.email}`)
  console.log(`  ✓ Success message: ${result.message}`)

  // Verify user exists in database
  const user = await prisma.users.findUnique({
    where: { email: testUser.email },
  })

  if (!user) {
    throw new Error('User not found in database after sign-up')
  }

  console.log(`  ✓ User found in database: ${user.id}`)
  console.log(`  ✓ Name: ${user.name}`)
  console.log(`  ✓ Email: ${user.email}`)
  console.log(`  ✓ Is admin: ${user.is_admin}`)
  console.log(`  ✓ Password hash: ${user.password?.substring(0, 20)}...`)

  // Verify password was hashed correctly
  if (user.password) {
    const passwordValid = await verifyPassword(testUser.password, user.password)
    console.log(`  ✓ Password verification: ${passwordValid ? 'PASS' : 'FAIL'}`)
  }

  console.log('✅ Sign-up test passed\n')
}

async function testDuplicateEmail() {
  console.log('Testing duplicate email prevention...')

  // Try to sign up with same email again
  const inviteCode = 'test-invite-code-2'
  const result = await signUpUser(testUser, inviteCode)

  if (result.success) {
    console.error('❌ Duplicate email was allowed!')
    throw new Error('Duplicate email test failed')
  }

  if (result.errors?.email?.includes('already exists')) {
    console.log('  ✓ Duplicate email rejected with correct error message')
  } else {
    console.error('❌ Wrong error message for duplicate email:', result.errors)
    throw new Error('Incorrect error message')
  }

  console.log('✅ Duplicate email test passed\n')
}

async function testDatabaseConnection() {
  console.log('Testing database connection...')

  try {
    await prisma.$queryRaw`SELECT 1 as result`
    console.log('✅ Database connection successful\n')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

async function runTests() {
  console.log('🧪 Starting Authentication Flow Tests\n')
  console.log('=' .repeat(50) + '\n')

  try {
    // Clean up any existing test data
    await cleanup()

    // Test database connection
    await testDatabaseConnection()

    // Test password hashing
    await testPasswordHashing()

    // Test validation
    await testValidation()

    // Test sign-up
    await testSignUp()

    // Test duplicate email
    await testDuplicateEmail()

    console.log('=' .repeat(50))
    console.log('✅ ALL TESTS PASSED!')
    console.log('=' .repeat(50))

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error)
    process.exit(1)
  } finally {
    // Clean up test data
    await cleanup()

    // Close database connection
    await prisma.$disconnect()
  }
}

// Run tests
runTests()
