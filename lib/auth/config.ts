/**
 * NextAuth.js Configuration
 *
 * Centralized authentication configuration for the application.
 * Uses Prisma adapter to store sessions in database.
 */

import { PrismaAdapter } from '@auth/prisma-adapter'
import { type NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { prisma } from '@/lib/db/client'

/**
 * NextAuth configuration object
 * See: https://next-auth.js.org/configuration/options
 */
export const authConfig: NextAuthConfig = {
  // Use Prisma adapter to store sessions in database
  adapter: PrismaAdapter(prisma),

  // Authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Request additional user info
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  // Pages configuration
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },

  // Callbacks for customizing behavior
  callbacks: {
    /**
     * Called when a user signs in
     * Updates last_login_at timestamp
     */
    async signIn({ user }) {
      if (user.id) {
        await prisma.users.update({
          where: { id: user.id },
          data: { last_login_at: new Date() },
        })
      }
      return true
    },

    /**
     * Called whenever a session is checked
     * Adds custom fields to the session object
     */
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch user to get is_admin field
        const dbUser = await prisma.users.findUnique({
          where: { id: user.id },
          select: { is_admin: true },
        })
        session.user.isAdmin = dbUser?.is_admin ?? false
      }
      return session
    },
  },

  // Session configuration
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
}
