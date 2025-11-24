/**
 * Admin Authorization Utilities
 *
 * Functions for checking admin permissions and protecting admin routes.
 */

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin === true
}

/**
 * Require admin access or redirect to home
 * Use this in server components that need admin-only access
 */
export async function requireAdmin(): Promise<void> {
  const admin = await isAdmin()
  if (!admin) {
    redirect('/')
  }
}

/**
 * Get current user if admin, otherwise null
 */
export async function getAdminUser() {
  const user = await getCurrentUser()
  return user?.isAdmin === true ? user : null
}
