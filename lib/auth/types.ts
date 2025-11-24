/**
 * NextAuth Type Extensions
 *
 * Extends NextAuth types to include custom fields.
 */

import 'next-auth'

declare module 'next-auth' {
  /**
   * Extended Session type with custom fields
   */
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      isAdmin: boolean
    }
  }

  /**
   * Extended User type with custom fields
   */
  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    isAdmin?: boolean
  }
}

declare module '@auth/core/adapters' {
  interface AdapterUser {
    isAdmin?: boolean
  }
}
