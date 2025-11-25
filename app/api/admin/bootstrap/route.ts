/**
 * Bootstrap Admin API Route
 *
 * Creates the first admin user in production.
 * This endpoint can only be used when NO users exist in the database.
 * It's protected by a secret token from environment variables.
 *
 * Usage:
 * POST https://your-domain.com/api/admin/bootstrap
 * Body: {
 *   "secret": "your-bootstrap-secret-from-env",
 *   "email": "admin@example.com",
 *   "password": "secure-password",
 *   "name": "Admin Name"
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { secret, email, password, name } = body

    // Validate required fields
    if (!secret || !email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: secret, email, password, name' },
        { status: 400 }
      )
    }

    // Check bootstrap secret from environment
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET
    if (!bootstrapSecret) {
      return NextResponse.json(
        { error: 'Bootstrap not configured (BOOTSTRAP_SECRET not set)' },
        { status: 503 }
      )
    }

    // Verify secret
    if (secret !== bootstrapSecret) {
      return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
    }

    // Check if any users exist
    const userCount = await prisma.users.count()
    if (userCount > 0) {
      return NextResponse.json(
        {
          error: 'Bootstrap not allowed - users already exist',
          userCount,
        },
        { status: 403 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create admin user
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        name,
        role: 'ADMIN',
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Bootstrap admin creation failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to create admin user',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Only allow POST
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
