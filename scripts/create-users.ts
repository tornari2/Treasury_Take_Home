// Script to create multiple users for your team
import '../lib/migrations';
import { userHelpers } from '../lib/db-helpers';
import { hashPassword } from '../lib/auth';

interface UserInput {
  email: string;
  password: string;
  name: string;
  role?: 'agent' | 'admin';
}

const usersToCreate: UserInput[] = [
  {
    email: 'alice@example.com',
    password: 'password123',
    name: 'Alice Smith',
    role: 'agent',
  },
  {
    email: 'bob@example.com',
    password: 'password123',
    name: 'Bob Johnson',
    role: 'agent',
  },
  {
    email: 'admin@example.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
  },
  // Add more users here as needed
];

async function createUsers() {
  console.log('Creating users...\n');

  for (const userInput of usersToCreate) {
    // Check if user already exists
    const existing = userHelpers.findByEmail(userInput.email);
    if (existing) {
      console.log(`⚠️  User already exists: ${userInput.email}`);
      continue;
    }

    try {
      // Hash password
      const passwordHash = await hashPassword(userInput.password);

      // Create user
      const result = userHelpers.create(
        userInput.email,
        passwordHash,
        userInput.name,
        userInput.role || 'agent'
      );

      console.log(`✅ Created user: ${userInput.name}`);
      console.log(`   Email: ${userInput.email}`);
      console.log(`   Password: ${userInput.password}`);
      console.log(`   Role: ${userInput.role || 'agent'}`);
      console.log(`   User ID: ${result.lastInsertRowid}\n`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userInput.email}:`, error);
    }
  }

  console.log('Done!');
}

createUsers().catch(console.error);
