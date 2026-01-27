// Script to create a test user
import '../lib/migrations';
import { userHelpers } from '../lib/db-helpers';
import { hashPassword } from '../lib/auth';

async function createTestUser() {
  const email = 'test@example.com';
  const password = 'password123';
  const name = 'Test User';

  // Check if user already exists
  const existing = userHelpers.findByEmail(email);
  if (existing) {
    console.log('User already exists:', email);
    return;
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const result = userHelpers.create(email, passwordHash, name, 'agent');

  console.log('Test user created:');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('User ID:', result.lastInsertRowid);
}

createTestUser().catch(console.error);
