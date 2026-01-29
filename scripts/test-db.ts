// Test script to verify database schema
import '../lib/migrations';
import db from '../lib/db';

console.log('Testing database schema...');

// Test that tables exist
const tables = db
  .prepare(
    `
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
`
  )
  .all() as Array<{ name: string }>;

console.log(
  'Tables created:',
  tables.map((t) => t.name)
);

// Test foreign key constraints
db.pragma('foreign_keys');

console.log('Foreign keys enabled:', db.pragma('foreign_keys', { simple: true }));

// Test indexes
const indexes = db
  .prepare(
    `
  SELECT name FROM sqlite_master 
  WHERE type='index' AND name NOT LIKE 'sqlite_%'
`
  )
  .all() as Array<{ name: string }>;

console.log(
  'Indexes created:',
  indexes.map((i) => i.name)
);

console.log('Database schema test completed successfully!');
