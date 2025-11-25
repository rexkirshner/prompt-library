/**
 * Sign-Up Page
 *
 * User registration form with client-side validation and progressive enhancement.
 * Works with or without JavaScript enabled.
 *
 * Requires an invite code via URL parameter: /auth/signup?invite=CODE
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './SignUpForm'

export const metadata: Metadata = {
  title: 'Sign Up - AI Prompts Library',
  description: 'Create a new account to submit and manage AI prompts',
}

interface SignUpPageProps {
  searchParams: Promise<{ invite?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { invite: inviteCode } = await searchParams

  // Show error if no invite code provided
  if (!inviteCode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Invite Required
            </h1>
            <p className="mt-4 text-sm text-gray-600">
              This platform is invite-only. You need an invitation link to create an account.
            </p>
            <p className="mt-6 text-sm text-gray-500">
              If you received an invite link, please use that link to sign up.
            </p>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link
              href="/auth/signin"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join our community to submit and share AI prompts
          </p>
        </div>

        {/* Sign-up form */}
        <SignUpForm inviteCode={inviteCode} />

        {/* Sign-in link */}
        <div className="text-center text-sm">
          <span className="text-gray-600">Already have an account? </span>
          <Link
            href="/auth/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
