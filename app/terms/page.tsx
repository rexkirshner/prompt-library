/**
 * Terms of Service Page
 *
 * Legal terms governing use of the service.
 * Covers content licensing, user conduct, and liability.
 */

import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - AI Prompt Library',
  description: 'Terms and conditions for using AI Prompt Library',
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-4xl font-bold text-gray-900">Terms of Service</h1>

      <div className="prose prose-gray max-w-none">
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Agreement to Terms</h2>
          <p className="mt-4 text-gray-700">
            By accessing or using AI Prompt Library ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Use of Service</h2>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Permitted Use</h3>
          <p className="mt-2 text-gray-700">
            You may use the Service to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Browse and search for AI prompts</li>
            <li>Copy and use prompts for any purpose (they are public domain)</li>
            <li>Submit original prompts for community benefit</li>
            <li>Create an account to track your submissions</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Prohibited Conduct</h3>
          <p className="mt-2 text-gray-700">
            You may NOT:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Submit prompts containing illegal, harmful, or offensive content</li>
            <li>Submit prompts you do not have the right to share</li>
            <li>Impersonate others or provide false information</li>
            <li>Attempt to gain unauthorized access to the Service</li>
            <li>Use automated tools to scrape or overload the Service</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Content and Licensing</h2>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">CC0 Public Domain Dedication</h3>
          <p className="mt-2 text-gray-700">
            All prompts submitted to this Service are released under{' '}
            <a
              href="https://creativecommons.org/publicdomain/zero/1.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              CC0 1.0 Universal (CC0 1.0) Public Domain Dedication
            </a>
            .
          </p>
          <p className="mt-4 text-gray-700">
            By submitting a prompt, you:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Waive all copyright and related rights to the prompt</li>
            <li>Dedicate the prompt to the public domain</li>
            <li>Allow anyone to use the prompt for any purpose without attribution</li>
            <li>Acknowledge this dedication is irrevocable</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Attribution</h3>
          <p className="mt-2 text-gray-700">
            While not legally required under CC0, we display author names as a courtesy. This attribution:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Does not grant you any rights over the prompts</li>
            <li>May be removed at our discretion</li>
            <li>Does not imply endorsement of derived works</li>
          </ul>

          <h3 className="mt-6 text-xl font-semibold text-gray-800">Original Content</h3>
          <p className="mt-2 text-gray-700">
            You represent and warrant that:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>You own or have the right to submit all content you provide</li>
            <li>Your submissions do not infringe on any third-party rights</li>
            <li>Your submissions comply with all applicable laws</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Accounts and Security</h2>
          <p className="mt-4 text-gray-700">
            When you create an account:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>You must provide accurate information</li>
            <li>You are responsible for maintaining account security</li>
            <li>You are responsible for all activities under your account</li>
            <li>You must notify us immediately of any unauthorized access</li>
          </ul>
          <p className="mt-4 text-gray-700">
            We may suspend or terminate accounts that violate these Terms.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Moderation</h2>
          <p className="mt-4 text-gray-700">
            All prompt submissions are subject to moderation. We reserve the right to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Approve, reject, or edit any submission</li>
            <li>Remove any content at our discretion</li>
            <li>Set quality standards for submissions</li>
            <li>Prioritize certain content for featuring</li>
          </ul>
          <p className="mt-4 text-gray-700">
            We do not guarantee that submitted content will be approved or remain available.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Disclaimer of Warranties</h2>
          <p className="mt-4 text-gray-700">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Warranties of merchantability or fitness for a particular purpose</li>
            <li>Accuracy, reliability, or completeness of content</li>
            <li>Uninterrupted or error-free operation</li>
            <li>Security of data transmission or storage</li>
          </ul>
          <p className="mt-4 text-gray-700">
            USE OF PROMPTS FROM THIS SERVICE IS AT YOUR OWN RISK. We make no warranties about the quality, safety, or legality of prompts.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Limitation of Liability</h2>
          <p className="mt-4 text-gray-700">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Indirect, incidental, special, or consequential damages</li>
            <li>Loss of profits, data, or goodwill</li>
            <li>Service interruptions or data loss</li>
            <li>Actions taken based on prompts from the Service</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Indemnification</h2>
          <p className="mt-4 text-gray-700">
            You agree to indemnify and hold harmless AI Prompt Library and its operators from any claims, damages, or expenses arising from:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Your use of the Service</li>
            <li>Your submissions to the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of others</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Termination</h2>
          <p className="mt-4 text-gray-700">
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-700">
            <li>Breach of these Terms</li>
            <li>Fraudulent or illegal activity</li>
            <li>Abuse of the Service</li>
          </ul>
          <p className="mt-4 text-gray-700">
            Upon termination, your right to use the Service will immediately cease. Prompts you submitted remain in the public domain under CC0.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Changes to Terms</h2>
          <p className="mt-4 text-gray-700">
            We reserve the right to modify these Terms at any time. We will notify users of material changes by updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Governing Law</h2>
          <p className="mt-4 text-gray-700">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where the Service operates, without regard to conflict of law provisions.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gray-900">Contact</h2>
          <p className="mt-4 text-gray-700">
            For questions about these Terms, please contact us through{' '}
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
          <div className="flex gap-6">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Homepage
            </Link>
            <Link
              href="/privacy"
              className="text-blue-600 hover:text-blue-800"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
