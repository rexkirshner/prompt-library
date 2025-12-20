/**
 * Seed Test Fixtures Script
 *
 * Seeds the database with compound prompts for integration testing.
 * Run with: npm run db:seed:test
 *
 * Creates:
 * - Simple component prompts (building blocks)
 * - Compound prompts that reference the simple ones
 * - Nested compound prompts (compound referencing compound)
 */

import { randomUUID } from 'crypto'
import { prisma } from '../lib/db/client'

/**
 * Main seeding function for test fixtures
 */
async function main() {
  console.log('🧪 Starting test fixture seeding...\n')

  // Check if test fixtures already exist (by slug prefix)
  const existingFixtures = await prisma.prompts.count({
    where: {
      slug: {
        startsWith: 'test-fixture-',
      },
    },
  })

  if (existingFixtures > 0) {
    console.log(`⚠️  Found ${existingFixtures} existing test fixtures.`)
    console.log('   Cleaning up old fixtures first...\n')

    // Delete old test fixtures
    await prisma.prompts.deleteMany({
      where: {
        slug: {
          startsWith: 'test-fixture-',
        },
      },
    })

    console.log('✅ Old fixtures cleaned up.\n')
  }

  console.log('📝 Creating test fixture prompts...\n')

  // 1. Create simple component prompts (building blocks)
  console.log('   Creating simple component prompts...')

  const greeting = await prisma.prompts.create({
    data: {
      id: randomUUID(),
      slug: 'test-fixture-greeting',
      title: 'Test Fixture: Greeting Component',
      description: 'A simple greeting component for testing compound prompts',
      prompt_text: 'Hello! I am a helpful AI assistant.',
      category: 'General',
      author_name: 'Test Suite',
      author_url: 'https://example.com',
      status: 'APPROVED',
      approved_at: new Date(),
      is_compound: false,
      ai_generated: false,
      view_count: 0,
      copy_count: 0,
    },
  })

  const context = await prisma.prompts.create({
    data: {
      id: randomUUID(),
      slug: 'test-fixture-context',
      title: 'Test Fixture: Context Component',
      description: 'A context setting component for testing',
      prompt_text: 'I specialize in helping with software development tasks.',
      category: 'Coding',
      author_name: 'Test Suite',
      author_url: 'https://example.com',
      status: 'APPROVED',
      approved_at: new Date(),
      is_compound: false,
      ai_generated: false,
      view_count: 0,
      copy_count: 0,
    },
  })

  const personality = await prisma.prompts.create({
    data: {
      id: randomUUID(),
      slug: 'test-fixture-personality',
      title: 'Test Fixture: Personality Component',
      description: 'A personality trait component for testing',
      prompt_text: 'I am concise and focus on practical solutions.',
      category: 'General',
      author_name: 'Test Suite',
      author_url: 'https://example.com',
      status: 'APPROVED',
      approved_at: new Date(),
      is_compound: false,
      ai_generated: false,
      view_count: 0,
      copy_count: 0,
    },
  })

  console.log(`   ✅ Created 3 simple component prompts\n`)

  // 2. Create a compound prompt (references 2 simple components)
  console.log('   Creating compound prompt (level 1)...')

  const basicCompound = await prisma.prompts.create({
    data: {
      id: randomUUID(),
      slug: 'test-fixture-basic-compound',
      title: 'Test Fixture: Basic Compound Prompt',
      description: 'A basic compound prompt for testing resolution',
      prompt_text: null, // Compound prompts don't have direct text
      category: 'Coding',
      author_name: 'Test Suite',
      author_url: 'https://example.com',
      status: 'APPROVED',
      approved_at: new Date(),
      is_compound: true,
      max_depth: 2,
      ai_generated: false,
      view_count: 0,
      copy_count: 0,
      compound_components: {
        create: [
          {
            component_prompt_id: greeting.id,
            position: 0,
            custom_text_before: null,
            custom_text_after: null,
          },
          {
            component_prompt_id: context.id,
            position: 1,
            custom_text_before: null,
            custom_text_after: null,
          },
          {
            component_prompt_id: null, // Custom text only
            position: 2,
            custom_text_before: null,
            custom_text_after: 'How can I help you today?',
          },
        ],
      },
    },
  })

  console.log(`   ✅ Created 1 compound prompt\n`)

  // 3. Create a nested compound prompt (references another compound + simple)
  console.log('   Creating nested compound prompt (level 2)...')

  const nestedCompound = await prisma.prompts.create({
    data: {
      id: randomUUID(),
      slug: 'test-fixture-nested-compound',
      title: 'Test Fixture: Nested Compound Prompt',
      description: 'A nested compound prompt for testing deep resolution',
      prompt_text: null,
      category: 'Coding',
      author_name: 'Test Suite',
      author_url: 'https://example.com',
      status: 'APPROVED',
      approved_at: new Date(),
      is_compound: true,
      max_depth: 3,
      ai_generated: false,
      view_count: 0,
      copy_count: 0,
      compound_components: {
        create: [
          {
            component_prompt_id: basicCompound.id, // References the compound prompt!
            position: 0,
            custom_text_before: '=== AI ASSISTANT PROMPT ===',
            custom_text_after: null,
          },
          {
            component_prompt_id: personality.id,
            position: 1,
            custom_text_before: null,
            custom_text_after: null,
          },
          {
            component_prompt_id: null,
            position: 2,
            custom_text_before: null,
            custom_text_after: '=== END PROMPT ===',
          },
        ],
      },
    },
  })

  console.log(`   ✅ Created 1 nested compound prompt\n`)

  // 4. Create a compound with custom text before/after
  console.log('   Creating compound with custom text...')

  const customTextCompound = await prisma.prompts.create({
    data: {
      id: randomUUID(),
      slug: 'test-fixture-custom-text-compound',
      title: 'Test Fixture: Compound with Custom Text',
      description: 'Tests custom text before and after components',
      prompt_text: null,
      category: 'General',
      author_name: 'Test Suite',
      author_url: 'https://example.com',
      status: 'APPROVED',
      approved_at: new Date(),
      is_compound: true,
      max_depth: 2,
      ai_generated: false,
      view_count: 0,
      copy_count: 0,
      compound_components: {
        create: [
          {
            component_prompt_id: null,
            position: 0,
            custom_text_before: 'START:',
            custom_text_after: null,
          },
          {
            component_prompt_id: greeting.id,
            position: 1,
            custom_text_before: 'Before greeting.',
            custom_text_after: 'After greeting.',
          },
          {
            component_prompt_id: null,
            position: 2,
            custom_text_before: null,
            custom_text_after: ':END',
          },
        ],
      },
    },
  })

  console.log(`   ✅ Created 1 compound with custom text\n`)

  // Display summary
  console.log('=' .repeat(50))
  console.log('✅ Test fixture seeding complete!\n')
  console.log('📊 Created:')
  console.log(`   - 3 simple component prompts`)
  console.log(`   - 1 basic compound prompt (level 1)`)
  console.log(`   - 1 nested compound prompt (level 2)`)
  console.log(`   - 1 custom text compound prompt`)
  console.log(`   Total: 6 test fixtures\n`)

  console.log('🔍 Test Fixture IDs:')
  console.log(`   Greeting:       ${greeting.id}`)
  console.log(`   Context:        ${context.id}`)
  console.log(`   Personality:    ${personality.id}`)
  console.log(`   Basic Compound: ${basicCompound.id}`)
  console.log(`   Nested Compound: ${nestedCompound.id}`)
  console.log(`   Custom Text:    ${customTextCompound.id}`)

  console.log('\n💡 Run integration tests with:')
  console.log('   npm test -- lib/api/__tests__/endpoints.test.ts\n')
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Test fixture seeding failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
