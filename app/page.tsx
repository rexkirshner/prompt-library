import Link from 'next/link'
import type { Metadata } from 'next'
import {
  getFeaturedPrompts,
  getRecentPrompts,
  getApprovedPromptCount,
} from '@/lib/db/cached-queries'
import { JsonLd } from '@/components/JsonLd'
import {
  generateWebSiteSchema,
  generateOrganizationSchema,
  getBaseUrl,
} from '@/lib/seo/json-ld'

// Force dynamic rendering - page fetches latest prompts
export const dynamic = 'force-dynamic'

// Homepage metadata with canonical URL
export const metadata: Metadata = {
  alternates: {
    canonical: getBaseUrl(),
  },
}

export default async function Home() {
  // Fetch all home page data in parallel using cached queries
  // React.cache() deduplicates if same data is needed elsewhere in render tree
  const [featuredPrompts, recentPrompts, totalCount] = await Promise.all([
    getFeaturedPrompts(3),
    getRecentPrompts(6),
    getApprovedPromptCount(),
  ])

  const baseUrl = getBaseUrl()

  // Generate structured data for SEO
  const websiteSchema = generateWebSiteSchema({
    name: 'Input Atlas',
    description:
      'A curated collection of high-quality AI prompts for the community. Browse, discover, and share prompts for ChatGPT, Claude, and other AI assistants.',
    url: baseUrl,
  })

  const organizationSchema = generateOrganizationSchema({
    name: 'Input Atlas',
    url: baseUrl,
  })

  return (
    <>
      {/* Structured data for SEO */}
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Hero Section */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Input Atlas
          </h1>
          <p className="mb-8 text-xl text-gray-600 dark:text-gray-400">
            A curated collection of high-quality AI prompts for the community
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/prompts"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
            >
              Browse {totalCount} Prompts
            </Link>
            <Link
              href="/submit"
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-6 py-3 text-sm font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Submit a Prompt
            </Link>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-12">
        {/* Featured Prompts */}
        {featuredPrompts.length > 0 && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Featured Prompts</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Hand-picked prompts showcasing quality examples
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPrompts.map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="group block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-shadow hover:shadow-lg dark:hover:shadow-gray-900/50"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block rounded-md bg-yellow-100 dark:bg-yellow-900 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-200">
                      ⭐ Featured
                    </span>
                    <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {prompt.category}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {prompt.title}
                  </h3>
                  {prompt.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                      {prompt.description}
                    </p>
                  )}
                  {prompt.prompt_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                        <span
                          key={tags.id}
                          className="rounded bg-blue-50 dark:bg-blue-900 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-200"
                        >
                          {tags.name}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recent Prompts */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recent Prompts</h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Latest additions to the library
              </p>
            </div>
            <Link
              href="/prompts"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPrompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.slug}`}
                className="group block rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm transition-shadow hover:shadow-lg dark:hover:shadow-gray-900/50"
              >
                <div className="mb-3">
                  <span className="inline-block rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                    {prompt.category}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {prompt.title}
                </h3>
                {prompt.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                    {prompt.description}
                  </p>
                )}
                {prompt.prompt_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                      <span
                        key={tags.id}
                        className="rounded bg-blue-50 dark:bg-blue-900 px-2 py-0.5 text-xs text-blue-700 dark:text-blue-200"
                      >
                        {tags.name}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
    </>
  )
}
