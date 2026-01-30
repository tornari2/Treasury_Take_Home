// Script to create a user on Railway
// This script handles the DATABASE_PATH automatically
import "../lib/migrations";
import { userHelpers } from "../lib/db-helpers";
import { hashPassword } from "../lib/auth";

// Override DATABASE_PATH if running locally with Railway env vars
if (
  process.env.DATABASE_PATH?.startsWith("/app") &&
  !require("fs").existsSync("/app")
) {
  // Running locally - use local path
  process.env.DATABASE_PATH = "./data/database.db";
}

async function createUser() {
  const email = process.env.USER_EMAIL || "test@example.com";
  const password = process.env.USER_PASSWORD || "password123";
  const name = process.env.USER_NAME || "Test User";
  const role = (process.env.USER_ROLE as "agent" | "admin") || "agent";

  // Check if user already exists
  const existing = userHelpers.findByEmail(email);
  if (existing) {
    console.log("User already exists:", email);
    return;
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = userHelpers.create(email, passwordHash, name, role);

  console.log("User created successfully:");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Name:", name);
  console.log("Role:", role);
  console.log("User ID:", result.lastInsertRowid);
}

createUser().catch(console.error);
