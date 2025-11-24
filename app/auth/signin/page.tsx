/**
 * Sign-In Page
 *
 * User authentication form with NextAuth integration.
 * Supports redirect after login and registration success message.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = {
  title: 'Sign In - AI Prompts Library',
  description: 'Sign in to your account to submit and manage AI prompts',
}

interface SignInPageProps {
  searchParams: {
    registered?: string
    redirectTo?: string
  }
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const { registered, redirectTo } = searchParams

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Sign in to continue
          </p>
        </div>

        {/* Registration success message */}
        {registered === 'true' && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">
              Account created successfully! Please sign in with your
              credentials.
            </p>
          </div>
        )}

        {/* Sign-in form */}
        <SignInForm redirectTo={redirectTo} />

        {/* Sign-up link */}
        <div className="text-center text-sm">
          <span className="text-gray-600">Don&apos;t have an account? </span>
          <Link
            href="/auth/signup"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
