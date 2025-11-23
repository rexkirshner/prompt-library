export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
          AI Prompts Library
        </h1>
        <p className="mb-8 text-xl text-gray-600">
          A curated collection of high-quality AI prompts for the community
        </p>
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <p className="text-gray-700">
            <strong>Status:</strong> Phase 0 - Foundation
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Building the infrastructure for a small community prompt library
          </p>
        </div>
      </main>
    </div>
  )
}
