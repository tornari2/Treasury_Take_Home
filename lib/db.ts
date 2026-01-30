import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbPath = process.env.DATABASE_PATH || "./data/database.db";

// Lazy database initialization to prevent build-time errors
let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) {
    // During build, skip database initialization
    const isBuildTime = process.env.NEXT_PHASE === "phase-production-build";
    if (isBuildTime) {
      throw new Error("Database initialization skipped during build phase");
    }

    try {
      // Ensure data directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        try {
          fs.mkdirSync(dbDir, { recursive: true });
        } catch (mkdirError: any) {
          // If mkdir fails (e.g., permission denied or path doesn't exist locally),
          // and we're using a Railway path, fall back to local path
          if (
            process.env.DATABASE_PATH &&
            process.env.DATABASE_PATH.startsWith("/app") &&
            (mkdirError.code === "EACCES" || mkdirError.code === "ENOENT")
          ) {
            // Running locally with Railway env vars - use local path instead
            const localDbPath = "./data/database.db";
            console.warn(
              `Warning: Cannot create ${dbPath} locally, using ${localDbPath} instead`,
            );
            const localDir = path.dirname(localDbPath);
            if (!fs.existsSync(localDir)) {
              fs.mkdirSync(localDir, { recursive: true });
            }
            dbInstance = new Database(localDbPath);
            dbInstance.pragma("foreign_keys = ON");
            return dbInstance;
          }
          throw mkdirError;
        }
      }

      // Create database connection
      dbInstance = new Database(dbPath);

      // Enable foreign keys
      dbInstance.pragma("foreign_keys = ON");
    } catch (error) {
      // Re-throw error in runtime (should not happen)
      throw error;
    }
  }
  return dbInstance;
}

// Create a proxy that lazily initializes the database
// During build, return a no-op proxy that won't cause errors
function isBuildTime(): boolean {
  // Check multiple indicators that we're in a build context
  if (process.env.NEXT_PHASE === "phase-production-build") return true;
  if (process.env.NODE_ENV === "production" && !process.env.DATABASE_PATH)
    return true;
  if (process.argv.some((arg) => arg.includes("next") && arg.includes("build")))
    return true;
  if (
    typeof process.env.npm_lifecycle_event !== "undefined" &&
    process.env.npm_lifecycle_event === "build"
  )
    return true;

  // Check if we're being imported during webpack compilation
  try {
    // @ts-ignore - webpack may be available during build
    if (typeof __webpack_require__ !== "undefined") {
      // Only consider it build time if DATABASE_PATH is not set
      return !process.env.DATABASE_PATH;
    }
  } catch {
    // Ignore
  }

  return false;
}

// Create a safe no-op proxy for build time
const buildTimeProxy = new Proxy({} as Database.Database, {
  get(_target, prop) {
    // Return no-op functions for common database methods
    // This prevents Next.js from hanging during static analysis
    const noOpFn = () => {};
    const noOpAsyncFn = async () => {};

    if (prop === "exec") return noOpFn;
    if (prop === "prepare")
      return () => ({
        run: noOpFn,
        get: () => undefined,
        all: () => [],
        bind: noOpFn,
      });
    if (prop === "transaction") return () => noOpFn;
    if (prop === "pragma") return noOpFn;

    // For any other property, return undefined or a no-op
    return undefined;
  },
}) as Database.Database;

export const db = isBuildTime()
  ? buildTimeProxy
  : (new Proxy({} as Database.Database, {
      get(_target, prop) {
        const db = getDb();
        const value = db[prop as keyof Database.Database];
        if (typeof value === "function") {
          return value.bind(db);
        }
        return value;
      },
    }) as Database.Database);

export default db;
