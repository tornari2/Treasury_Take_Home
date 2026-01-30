// Quick script to create a test user via Railway
// Usage: railway run npx tsx scripts/create-test-user-quick.ts

import "../lib/migrations";
import { userHelpers } from "../lib/db-helpers";
import { hashPassword } from "../lib/auth";

async function createTestUser() {
  const email = "test@example.com";
  const password = "test123";
  const name = "Test User";
  const role = "agent";

  // Check if user already exists
  const existing = userHelpers.findByEmail(email);
  if (existing) {
    console.log("✅ User already exists:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${name}`);
    return;
  }

  try {
    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = userHelpers.create(email, passwordHash, name, role);

    console.log("✅ Test user created successfully!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Name: ${name}`);
    console.log(`   Role: ${role}`);
    console.log(`   User ID: ${result.lastInsertRowid}`);
    console.log("\n📝 You can now use these credentials to test the app.");
  } catch (error) {
    console.error("❌ Failed to create user:", error);
    process.exit(1);
  }
}

createTestUser().catch(console.error);
