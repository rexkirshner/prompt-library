/**
 * API Documentation Page
 *
 * Public documentation for the Input Atlas API.
 * Provides endpoint reference, examples, and usage guidelines.
 */

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'API Documentation - Input Atlas',
  description: 'Documentation for the Input Atlas public API',
}

export default function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          API Documentation
        </h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Access Input Atlas prompts programmatically with our public API.
          No authentication required.
        </p>
      </div>

      {/* Overview */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Overview
        </h2>
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-6">
          <p className="text-gray-700 dark:text-gray-300">
            <strong>Base URL:</strong>{' '}
            <code className="rounded bg-white dark:bg-gray-800 px-2 py-1">
              https://www.inputatlas.com/api/v1
            </code>
          </p>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            <strong>Format:</strong> JSON
          </p>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            <strong>Authentication:</strong> None required
          </p>
          <p className="mt-2 text-gray-700 dark:text-gray-300">
            <strong>Rate Limit:</strong> 100 requests per hour per IP address
          </p>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-12">
        <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Endpoints
        </h2>

        {/* List Prompts */}
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded bg-green-100 dark:bg-green-900 px-3 py-1 text-sm font-semibold text-green-800 dark:text-green-200">
              GET
            </span>
            <code className="text-lg font-mono">/prompts</code>
          </div>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            List prompts with optional search, filters, and pagination.
          </p>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Query Parameters
          </h3>
          <ul className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <code>q</code> - Search query (searches title, description, text)
            </li>
            <li>
              <code>category</code> - Filter by category (exact match)
            </li>
            <li>
              <code>tags</code> - Comma-separated tag slugs (requires all)
            </li>
            <li>
              <code>sort</code> - Sort order: <code>newest</code> (default) or <code>alphabetical</code>
            </li>
            <li>
              <code>page</code> - Page number (default: 1)
            </li>
            <li>
              <code>limit</code> - Items per page (default: 20, max: 100)
            </li>
          </ul>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Example Request
          </h3>
          <pre className="mb-4 overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              GET /api/v1/prompts?q=email&limit=10&sort=alphabetical
            </code>
          </pre>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Example Response
          </h3>
          <pre className="overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              {`{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "email-response-generator",
      "title": "Email Response Generator",
      "description": "...",
      "prompt_text": null,
      "resolved_text": "...",
      "category": "Writing",
      "author_name": "...",
      "author_url": null,
      "tags": [
        { "slug": "email", "name": "email" }
      ],
      "is_compound": true,
      "featured": true,
      "created_at": "2025-11-26T16:10:00.000Z",
      "updated_at": "2025-11-26T16:10:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}`}
            </code>
          </pre>
        </div>

        {/* Get Single Prompt */}
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded bg-green-100 dark:bg-green-900 px-3 py-1 text-sm font-semibold text-green-800 dark:text-green-200">
              GET
            </span>
            <code className="text-lg font-mono">/prompts/:identifier</code>
          </div>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Get a single prompt by slug or UUID.
          </p>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Example Requests
          </h3>
          <pre className="mb-2 overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              GET /api/v1/prompts/email-response-generator
            </code>
          </pre>
          <pre className="overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              GET /api/v1/prompts/550e8400-e29b-41d4-a716-446655440000
            </code>
          </pre>
        </div>

        {/* Categories */}
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded bg-green-100 dark:bg-green-900 px-3 py-1 text-sm font-semibold text-green-800 dark:text-green-200">
              GET
            </span>
            <code className="text-lg font-mono">/categories</code>
          </div>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Get all prompt categories.
          </p>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Example Response
          </h3>
          <pre className="overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              {`{
  "success": true,
  "data": ["Coding", "Writing", "Research", ...]
}`}
            </code>
          </pre>
        </div>

        {/* Tags */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded bg-green-100 dark:bg-green-900 px-3 py-1 text-sm font-semibold text-green-800 dark:text-green-200">
              GET
            </span>
            <code className="text-lg font-mono">/tags</code>
          </div>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Get popular tags sorted by usage.
          </p>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Query Parameters
          </h3>
          <ul className="mb-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>
              <code>limit</code> - Number of tags to return (default: 50, max: 100)
            </li>
          </ul>

          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Example Response
          </h3>
          <pre className="overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              {`{
  "success": true,
  "data": [
    {
      "id": "...",
      "slug": "ai",
      "name": "AI"
    },
    ...
  ]
}`}
            </code>
          </pre>
        </div>
      </section>

      {/* Rate Limiting */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Rate Limiting
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            The API is rate limited to <strong>100 requests per hour</strong> per IP address.
          </p>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            When you exceed the limit, you'll receive a <code>429 Too Many Requests</code> response
            with a <code>Retry-After</code> header indicating when you can make requests again.
          </p>
          <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Example Rate Limit Response
          </h3>
          <pre className="overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              {`HTTP/1.1 429 Too Many Requests
Retry-After: 3600

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 minutes."
  }
}`}
            </code>
          </pre>
        </div>
      </section>

      {/* CORS */}
      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          CORS Support
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          The API supports Cross-Origin Resource Sharing (CORS) and can be accessed from
          any domain. All responses include the appropriate CORS headers.
        </p>
      </section>

      {/* Error Handling */}
      <section>
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
          Error Responses
        </h2>
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            All error responses follow this format:
          </p>
          <pre className="overflow-x-auto rounded bg-gray-100 dark:bg-gray-900 p-4">
            <code className="text-sm">
              {`{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}`}
            </code>
          </pre>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Common error codes: <code>NOT_FOUND</code>, <code>INVALID_LIMIT</code>,{' '}
            <code>INVALID_PAGE</code>, <code>INVALID_SORT</code>, <code>RATE_LIMIT_EXCEEDED</code>,{' '}
            <code>INTERNAL_ERROR</code>
          </p>
        </div>
      </section>
    </div>
  )
}
