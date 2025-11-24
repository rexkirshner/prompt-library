/**
 * Authentication Utility Functions
 *
 * Helper functions for common authentication tasks.
 */

import { redirect } from 'next/navigation'
import { auth } from '.'
import type { Session } from 'next-auth'

/**
 * Get the current session (server-side only)
 * Returns null if not authenticated
 *
 * @example
 * const session = await getSession()
 * if (session) {
 *   console.log('User:', session.user.email)
 * }
 */
export async function getSession(): Promise<Session | null> {
  return await auth()
}

/**
 * Get the current user from session (server-side only)
 * Returns null if not authenticated
 *
 * @example
 * const user = await getCurrentUser()
 * if (user) {
 *   console.log('User ID:', user.id)
 * }
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/**
 * Require authentication for a page/route
 * Redirects to sign-in page if not authenticated
 *
 * @param redirectTo - Optional path to redirect back to after sign-in
 * @returns The current session
 *
 * @example
 * // In a server component or route
 * const session = await requireAuth()
 * // User is guaranteed to be authenticated here
 */
export async function requireAuth(redirectTo?: string): Promise<Session> {
  const session = await getSession()

  if (!session) {
    const callbackUrl = redirectTo || '/dashboard'
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  return session
}

/**
 * Require admin role for a page/route
 * Redirects to sign-in if not authenticated, or to home if not admin
 *
 * @returns The current session (user is guaranteed to be admin)
 *
 * @example
 * // In an admin page
 * const session = await requireAdmin()
 * // User is guaranteed to be authenticated AND an admin here
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth()

  if (!session.user?.isAdmin) {
    redirect('/')
  }

  return session
}

/**
 * Check if the current user is an admin (server-side only)
 * Returns false if not authenticated or not admin
 *
 * @example
 * const isAdmin = await checkIsAdmin()
 * if (isAdmin) {
 *   // Show admin features
 * }
 */
export async function checkIsAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.isAdmin ?? false
}
