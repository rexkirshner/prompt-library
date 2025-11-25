/**
 * Seed Prompts Script
 *
 * Seeds the database with initial quality prompts for testing and demonstration.
 * Run with: npm run db:seed
 *
 * Uses the JSON import service to load prompts from prompts-seed-data.json.
 * This ensures consistency between manual imports and automated seeding.
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { prisma } from '../lib/db/client'
import { ImportService } from '../lib/import-export/services/import-service'

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

  // Read JSON seed data
  const seedDataPath = join(process.cwd(), 'prompts-seed-data.json')
  console.log(`📂 Reading seed data from: ${seedDataPath}\n`)

  let jsonData: string
  try {
    jsonData = readFileSync(seedDataPath, 'utf-8')
  } catch (error) {
    console.error('❌ Failed to read seed data file:', error)
    console.error('   Make sure prompts-seed-data.json exists in the project root.\n')
    process.exit(1)
  }

  // Parse to get count for display
  let totalCount = 0
  try {
    const parsed = JSON.parse(jsonData)
    totalCount = parsed.total_count || parsed.prompts?.length || 0
  } catch (error) {
    console.error('❌ Failed to parse seed data JSON:', error)
    process.exit(1)
  }

  console.log(`📝 Importing ${totalCount} prompts from JSON file...\n`)

  // Use ImportService to load prompts
  const importService = new ImportService()
  const result = await importService.importAll(jsonData, {
    onDuplicate: 'skip', // Skip duplicates (safest for seeding)
  })

  // Display results
  console.log('\n' + '='.repeat(50))
  if (result.success) {
    console.log('✅ Seeding complete!')
    console.log(`   Total processed: ${result.total}`)
    console.log(`   Successfully imported: ${result.imported}`)
    console.log(`   Skipped (duplicates): ${result.skipped}`)
    console.log(`   Failed: ${result.failed}`)

    // Show any warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:')
      result.warnings.forEach((warning) => {
        console.log(`   - [${warning.slug}] ${warning.message}`)
      })
    }

    // Count final results
    const promptCount = await prisma.prompts.count()
    const tagCount = await prisma.tags.count()
    console.log('\n📊 Database Statistics:')
    console.log(`   Prompts: ${promptCount}`)
    console.log(`   Tags: ${tagCount}`)
    console.log('\n🔗 View at: http://localhost:3001/prompts\n')
  } else {
    console.log('❌ Seeding failed!')
    console.log(`   Total processed: ${result.total}`)
    console.log(`   Successfully imported: ${result.imported}`)
    console.log(`   Skipped (duplicates): ${result.skipped}`)
    console.log(`   Failed: ${result.failed}`)

    if (result.errors.length > 0) {
      console.log('\n❌ Errors:')
      result.errors.forEach((error) => {
        if (error.index >= 0) {
          console.log(`   - Prompt ${error.index}: ${error.message}`)
        } else {
          console.log(`   - ${error.message}`)
        }
      })
    }

    console.log('\n💡 Tip: Check prompts-seed-data.json for data issues.\n')
    process.exit(1)
  }
}

// Run the seed function
main()
  .catch((error) => {
    console.error('❌ Seeding failed with unexpected error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
