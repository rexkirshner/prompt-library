#!/usr/bin/env tsx
/**
 * Bootstrap Script: Create First Admin Account
 *
 * Purpose: Creates the initial admin account, bypassing the invite requirement.
 * This script should only be run once during initial setup.
 *
 * Usage:
 *   npm run admin:create-first
 *   OR
 *   dotenv -e .env.local -- tsx scripts/create-first-admin.ts
 *
 * Security:
 *   - Requires CLI/server access (not exposed via web)
 *   - Uses same bcrypt hashing as regular signup
 *   - Checks if any users exist before creating
 *   - Prevents duplicate admin creation
 */

import { prisma } from "../lib/db/client";
import { hashPassword } from "../lib/auth/password";
import * as readline from "readline";
import { randomUUID } from "crypto";

interface PromptAnswer {
  email: string;
  password: string;
  name: string;
}

/**
 * Prompt user for input via CLI
 */
function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Validate email format (basic check)
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password: string): boolean {
  // Minimum 8 characters (matches lib/auth/password.ts requirements)
  return password.length >= 8;
}

/**
 * Collect admin details from user
 */
async function collectAdminDetails(): Promise<PromptAnswer> {
  console.log("\n📋 Enter details for the first admin account:\n");

  let email = "";
  while (!email || !isValidEmail(email)) {
    email = await prompt("Email: ");
    if (!isValidEmail(email)) {
      console.log("❌ Invalid email format. Please try again.");
    }
  }

  let password = "";
  while (!password || !isValidPassword(password)) {
    password = await prompt("Password (min 8 characters): ");
    if (!isValidPassword(password)) {
      console.log("❌ Password must be at least 8 characters. Please try again.");
    }
  }

  const name = await prompt("Name (optional): ");

  return { email, password, name: name || undefined };
}

/**
 * Main execution
 */
async function main() {
  console.log("🚀 Bootstrap: Create First Admin Account\n");

  try {
    // Check if any users already exist
    const existingUserCount = await prisma.users.count();

    if (existingUserCount > 0) {
      console.log("⚠️  Warning: Users already exist in the database.");
      console.log(`   Found ${existingUserCount} existing user(s).`);
      console.log(
        "\n   This script is intended for initial setup only.",
      );

      const confirm = await prompt(
        "\nDo you want to create another admin anyway? (yes/no): ",
      );
      if (confirm.toLowerCase() !== "yes") {
        console.log("\n❌ Aborted. No changes made.");
        return;
      }
    }

    // Collect admin details
    const details = await collectAdminDetails();

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: details.email },
    });

    if (existingUser) {
      console.log(`\n❌ Error: User with email "${details.email}" already exists.`);
      console.log("   Please use a different email address.");
      return;
    }

    // Hash password using same utility as signup
    const hashedPassword = await hashPassword(details.password);

    // Create admin user
    const admin = await prisma.users.create({
      data: {
        id: randomUUID(),
        email: details.email,
        password: hashedPassword,
        name: details.name || null,
        is_admin: true, // This is the key difference - admin flag set to true
        invited_by: null, // No inviter for bootstrap admin
      },
    });

    console.log("\n✅ Success! First admin account created:\n");
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name:  ${admin.name || "(none)"}`);
    console.log(`   Admin: ${admin.is_admin}`);
    console.log(`\n🎉 You can now sign in at /auth/signin`);
    console.log(`   After signing in, you can generate invite codes at /admin/invites\n`);
  } catch (error) {
    console.error("\n❌ Error creating admin account:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
