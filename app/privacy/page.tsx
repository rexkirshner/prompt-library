/**
 * Privacy Policy Page
 *
 * Explains data collection, usage, and user rights.
 * Required for GDPR compliance and user trust.
 */

import { Metadata } from 'next'
import Link from 'next/link'
import { JsonLd } from '@/components/JsonLd'
import { generateFAQSchema } from '@/lib/seo/json-ld'

export const metadata: Metadata = {
  title: 'Privacy Policy - Input Atlas',
  description: 'How we collect, use, and protect your data',
}

export default function PrivacyPage() {
  // FAQ schema for rich snippets in search results
  const faqSchema = generateFAQSchema([
    {
      question: 'What personal information do you collect?',
      answer: 'We collect your email address, optional name, and encrypted password when you create an account. When you submit a prompt, we collect the prompt content, author name, optional website URL, and selected category and tags. We also automatically collect view counts and copy counts for usage statistics.',
    },
    {
      question: 'Do you sell my personal data?',
      answer: 'No, we do not sell your personal information. Your data may only be shared in specific circumstances: approved prompts and author names are publicly visible, data may be shared if required by law or legal process, and with hosting providers (Vercel) necessary to operate the service.',
    },
    {
      question: 'How do you protect my password?',
      answer: 'Passwords are encrypted using bcrypt with 12 rounds. We also use HTTPS/TLS encryption for all data transmission, secure session management, and regular security updates.',
    },
    {
      question: 'What are my rights under GDPR?',
      answer: 'If you are in the European Economic Area (EEA), you have the right to access (request a copy of your data), rectification (correct inaccurate data), erasure (delete your account and data), data portability (request your data in portable format), and objection (object to processing of your data). Note that approved prompts are public domain under CC0 and cannot be retroactively removed from public access after approval.',
    },
    {
      question: 'Do you use cookies or tracking?',
      answer: 'We use minimal cookies. We require a session cookie for authentication (HTTP-only, secure), but we do not use third-party analytics or advertising cookies for tracking.',
    },
  ])

  return (
    <>
      {/* FAQ Schema for SEO */}
      <JsonLd data={faqSchema} />

      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-gray-100">Privacy Policy</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Introduction</h2>
          <p className="mt-4 text-gray-700">
            Input Atlas (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Information We Collect</h2>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Account Information</h3>
          <p className="mt-2 text-gray-700">
            When you create an account, we collect:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Email address</li>
            <li>Name (optional)</li>
            <li>Password (encrypted with bcrypt)</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Prompt Submissions</h3>
          <p className="mt-2 text-gray-700">
            When you submit a prompt, we collect:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Prompt content (title, text, description, examples)</li>
            <li>Author name (publicly displayed)</li>
            <li>Optional author website URL</li>
            <li>Selected category and tags</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Usage Data</h3>
          <p className="mt-2 text-gray-700">
            We automatically collect:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>View counts for prompts</li>
            <li>Copy counts when you use the &ldquo;Copy&rdquo; button</li>
            <li>Basic server logs for debugging</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">How We Use Your Information</h2>
          <p className="mt-4 text-gray-700">
            We use collected information to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Provide and maintain the service</li>
            <li>Authenticate your account</li>
            <li>Attribute prompt submissions to authors</li>
            <li>Moderate submitted content</li>
            <li>Track usage statistics</li>
            <li>Improve the service</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Data Sharing and Disclosure</h2>
          <p className="mt-4 text-gray-700">
            We do not sell your personal information. Your data may be shared only in these circumstances:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li><strong>Public Content:</strong> All approved prompts and associated author names are publicly visible</li>
            <li><strong>Legal Requirements:</strong> If required by law or legal process</li>
            <li><strong>Service Providers:</strong> With hosting providers (Vercel) necessary to operate the service</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Content License</h2>
          <p className="mt-4 text-gray-700">
            All prompts submitted to this library are released under{' '}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              CC0 (Public Domain)
            </a>
            . By submitting a prompt, you dedicate it to the public domain and waive all copyright claims.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Data Security</h2>
          <p className="mt-4 text-gray-700">
            We implement security measures including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Encrypted passwords (bcrypt with 12 rounds)</li>
            <li>HTTPS/TLS encryption for data transmission</li>
            <li>Secure session management</li>
            <li>Regular security updates</li>
          </ul>
          <p className="mt-4 text-gray-700">
            However, no system is 100% secure. Use strong passwords and protect your account credentials.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Your Rights (GDPR)</h2>
          <p className="mt-4 text-gray-700">
            If you are in the European Economic Area (EEA), you have these rights:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your account and data</li>
            <li><strong>Data Portability:</strong> Request your data in a portable format</li>
            <li><strong>Objection:</strong> Object to processing of your personal data</li>
          </ul>
          <p className="mt-4 text-gray-700">
            Note: Approved prompts are public domain under CC0 and cannot be retroactively removed from public access after approval.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Cookies and Tracking</h2>
          <p className="mt-4 text-gray-700">
            We use minimal cookies:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li><strong>Session Cookie:</strong> Required for authentication (HTTP-only, secure)</li>
            <li><strong>No Tracking:</strong> We do not use third-party analytics or advertising cookies</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Children&apos;s Privacy</h2>
          <p className="mt-4 text-gray-700">
            Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Changes to This Policy</h2>
          <p className="mt-4 text-gray-700">
            We may update this Privacy Policy from time to time. We will notify users of significant changes by updating the &ldquo;Last updated&rdquo; date.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Contact Us</h2>
          <p className="mt-4 text-gray-700">
            For privacy-related questions or to exercise your rights, please contact us through{' '}
            <a
              href="https://github.com/rexkirshner/prompt-library/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              GitHub Issues
            </a>
            .
          </p>
        </section>

        <div className="mt-12 border-t border-gray-200 pt-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
    </>
  )
}
