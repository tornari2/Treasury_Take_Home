import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || './data/database.db';

// Lazy database initialization to prevent build-time errors
let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) {
    // During build, skip database initialization
    const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';
    if (isBuildTime) {
      throw new Error('Database initialization skipped during build phase');
    }

    try {
      // Ensure data directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // Create database connection
      dbInstance = new Database(dbPath);

      // Enable foreign keys
      dbInstance.pragma('foreign_keys = ON');
    } catch (error) {
      // Re-throw error in runtime (should not happen)
      throw error;
    }
  }
  return dbInstance;
}

// Create a proxy that lazily initializes the database
// During build, return a no-op proxy that won't cause errors
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build';

export const db = isBuildTime
  ? (new Proxy({} as Database.Database, {
      get() {
        // During build, return a function that does nothing
        return () => {
          throw new Error('Database not available during build');
        };
      },
    }) as Database.Database)
  : (new Proxy({} as Database.Database, {
      get(_target, prop) {
        const db = getDb();
        const value = db[prop as keyof Database.Database];
        if (typeof value === 'function') {
          return value.bind(db);
        }
        return value;
      },
    }) as Database.Database);

export default db;
