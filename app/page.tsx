import Link from 'next/link'
import { prisma } from '@/lib/db/client'

// Force dynamic rendering - page fetches latest prompts
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch featured prompts
  const featuredPrompts = await prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
      featured: true,
    },
    include: {
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 3,
  })

  // Fetch recent prompts
  const recentPrompts = await prisma.prompts.findMany({
    where: {
      status: 'APPROVED',
      deleted_at: null,
    },
    include: {
      prompt_tags: {
        include: {
          tags: true,
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    take: 6,
  })

  // Get total count
  const totalCount = await prisma.prompts.count({
    where: {
      status: 'APPROVED',
      deleted_at: null,
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
            AI Prompts Library
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            A curated collection of high-quality AI prompts for the community
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/prompts"
              className="rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Browse {totalCount} Prompts
            </Link>
            <Link
              href="/submit"
              className="rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50"
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
              <h2 className="text-2xl font-bold text-gray-900">Featured Prompts</h2>
              <p className="mt-1 text-sm text-gray-600">
                Hand-picked prompts showcasing quality examples
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredPrompts.map((prompt) => (
                <Link
                  key={prompt.id}
                  href={`/prompts/${prompt.slug}`}
                  className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="mb-3 flex items-center gap-2">
                    <span className="inline-block rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      ⭐ Featured
                    </span>
                    <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                      {prompt.category}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {prompt.title}
                  </h3>
                  {prompt.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                      {prompt.description}
                    </p>
                  )}
                  {prompt.prompt_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                        <span
                          key={tags.id}
                          className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
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
              <h2 className="text-2xl font-bold text-gray-900">Recent Prompts</h2>
              <p className="mt-1 text-sm text-gray-600">
                Latest additions to the library
              </p>
            </div>
            <Link
              href="/prompts"
              className="text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentPrompts.map((prompt) => (
              <Link
                key={prompt.id}
                href={`/prompts/${prompt.slug}`}
                className="group block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="mb-3">
                  <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {prompt.category}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {prompt.title}
                </h3>
                {prompt.description && (
                  <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                    {prompt.description}
                  </p>
                )}
                {prompt.prompt_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {prompt.prompt_tags.slice(0, 3).map(({ tags }) => (
                      <span
                        key={tags.id}
                        className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
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
  )
}
