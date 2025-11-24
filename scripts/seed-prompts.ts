/**
 * Seed Prompts Script
 *
 * Seeds the database with initial quality prompts for testing and demonstration.
 * Run with: npm run db:seed
 */

import { prisma } from '../lib/db/client'
import { generateSlug, normalizeTag } from '../lib/prompts/validation'

interface SeedPrompt {
  title: string
  promptText: string
  description: string
  exampleOutput?: string
  category: string
  tags: string[]
  authorName: string
  authorUrl?: string
}

const seedPrompts: SeedPrompt[] = [
  {
    title: 'Modular Development Guidelines',
    promptText: `Your core guidelines are 1) prioritize modularity 2) focus on documentation and maintainability 3) always ensure we build testing as we go, and use it to confirm things work before we move on to the next thing. I want you to commit liberally and often, but do not push to github without my permission.`,
    description: 'Set clear development principles for AI coding assistants: modularity, documentation, testing, and git workflow.',
    exampleOutput: 'The assistant will follow modular architecture, write comprehensive documentation, create tests before proceeding, and commit frequently while only pushing with explicit permission.',
    category: 'Coding & Development',
    tags: ['development', 'git-workflow', 'best-practices', 'testing', 'modularity'],
    authorName: 'Rex Kirshner',
    authorUrl: 'https://github.com/rexkirshner',
  },
  {
    title: 'Git Workflow Rules for AI Assistants',
    promptText: `For this session, please follow these git workflow rules:

1. Commit liberally and often - Create git commits whenever you complete a logical unit of work (fixing a bug, adding a feature, refactoring a section, etc.)
2. NEVER push to GitHub without explicit permission - You may stage files (git add) and commit locally (git commit), but ONLY push to remote (git push) when I explicitly say "push to github" or similar.
3. Permission does NOT carry forward - If I say "commit and push" for one change, that permission applies ONLY to that specific commit. Future commits require NEW explicit permission to push.

Think of it as: Local commits are safe and encouraged. Remote pushes require explicit approval each time.

Understood?`,
    description: 'Establish safe git practices for AI coding assistants with clear commit/push boundaries.',
    exampleOutput: 'The assistant will commit frequently for logical units of work, but will never push to remote without explicit permission for each push.',
    category: 'Coding & Development',
    tags: ['git', 'workflow', 'version-control', 'safety', 'permissions'],
    authorName: 'Rex Kirshner',
    authorUrl: 'https://github.com/rexkirshner',
  },
]

/**
 * Create or find tag by name
 */
async function ensureTag(tagName: string): Promise<string> {
  const normalizedName = normalizeTag(tagName)
  const slug = generateSlug(normalizedName)

  let tag = await prisma.tags.findUnique({
    where: { slug },
  })

  if (!tag) {
    tag = await prisma.tags.create({
      data: {
        id: crypto.randomUUID(),
        name: normalizedName,
        slug,
        usage_count: 0,
        created_at: new Date(),
      },
    })
  }

  return tag.id
}

/**
 * Generate unique slug for prompt
 */
async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = generateSlug(title)
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await prisma.prompts.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Seed a single prompt
 */
async function seedPrompt(promptData: SeedPrompt) {
  console.log(`  Seeding: "${promptData.title}"...`)

  // Generate unique slug
  const slug = await generateUniqueSlug(promptData.title)

  // Ensure all tags exist
  const tagIds = await Promise.all(
    promptData.tags.map((tag) => ensureTag(tag)),
  )

  // Create prompt
  const now = new Date()
  const prompt = await prisma.prompts.create({
    data: {
      id: crypto.randomUUID(),
      slug,
      title: promptData.title,
      prompt_text: promptData.promptText,
      description: promptData.description,
      example_output: promptData.exampleOutput || null,
      category: promptData.category,
      author_name: promptData.authorName,
      author_url: promptData.authorUrl || null,
      submitted_by_user_id: null, // Seed prompts have no user association
      status: 'APPROVED', // Seed prompts are pre-approved
      featured: false,
      view_count: 0,
      copy_count: 0,
      created_at: now,
      updated_at: now,
      approved_at: now,
      approved_by_user_id: null,
    },
  })

  // Create tag associations
  await prisma.prompt_tags.createMany({
    data: tagIds.map((tagId) => ({
      prompt_id: prompt.id,
      tag_id: tagId,
    })),
  })

  // Update tag usage counts
  await prisma.tags.updateMany({
    where: { id: { in: tagIds } },
    data: { usage_count: { increment: 1 } },
  })

  console.log(`    ✓ Created with slug: ${slug}`)
  return prompt
}

/**
 * Main seeding function
 */
async function main() {
  console.log('🌱 Starting prompt seeding...\n')

  // Check if prompts already exist
  const existingCount = await prisma.prompts.count()
  if (existingCount > 0) {
    console.log(`⚠️  Database already contains ${existingCount} prompt(s).`)
    console.log('   Skipping seed to avoid duplicates.')
    console.log('   Run "npm run db:reset" to reset the database first.\n')
    return
  }

  console.log(`📝 Seeding ${seedPrompts.length} prompts...\n`)

  for (const promptData of seedPrompts) {
    await seedPrompt(promptData)
  }

  // Count results
  const promptCount = await prisma.prompts.count()
  const tagCount = await prisma.tags.count()

  console.log('\n✅ Seeding complete!')
  console.log(`   Prompts: ${promptCount}`)
  console.log(`   Tags: ${tagCount}`)
  console.log('\n🔗 View at: http://localhost:3001/prompts\n')
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
