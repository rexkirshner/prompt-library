/**
 * NextAuth.js Configuration
 *
 * Centralized authentication configuration for the application.
 * Uses Prisma adapter to store sessions in database.
 * Email/password authentication with bcrypt password hashing.
 */

import { PrismaAdapter } from '@auth/prisma-adapter'
import { type NextAuthConfig } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/db/client'
import { verifyPassword } from './password'

/**
 * NextAuth configuration object
 * See: https://next-auth.js.org/configuration/options
 */
export const authConfig: NextAuthConfig = {
  // Use Prisma adapter to store sessions in database
  adapter: PrismaAdapter(prisma),

  // Authentication providers
  providers: [
    CredentialsProvider({
      name: 'Email and Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Find user by email
        const user = await prisma.users.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        // Verify password
        const isValid = await verifyPassword(credentials.password as string, user.password)

        if (!isValid) {
          return null
        }

        // Return user object (NextAuth will create session)
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
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
     * Called whenever JWT is created or updated
     * Add user ID and admin status to token
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // Fetch user to get is_admin field
        const dbUser = await prisma.users.findUnique({
          where: { id: user.id },
          select: { is_admin: true },
        })
        token.isAdmin = dbUser?.is_admin ?? false
      }
      return token
    },

    /**
     * Called whenever session is checked
     * Add custom fields from JWT to session
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },

  // Session configuration
  // Note: Credentials provider requires JWT strategy (not database)
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Enable debug messages in development
  debug: process.env.NODE_ENV === 'development',
}
