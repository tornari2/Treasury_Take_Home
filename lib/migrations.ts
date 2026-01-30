import db from './db';

export function runMigrations() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'agent' CHECK(role IN ('agent', 'admin')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Create applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_name TEXT NOT NULL,
      beverage_type TEXT NOT NULL CHECK(beverage_type IN ('spirits', 'wine', 'beer')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'needs_review', 'approved', 'rejected')),
      assigned_agent_id INTEGER,
      application_data TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      review_notes TEXT,
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
    )
  `);

  // Migration: Rename expected_label_data to application_data if column exists
  try {
    db.exec(`
      ALTER TABLE applications 
      RENAME COLUMN expected_label_data TO application_data
    `);
  } catch (error) {
    // Column might not exist or already renamed - that's okay
  }

  // Create label_images table
  db.exec(`
    CREATE TABLE IF NOT EXISTS label_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      image_type TEXT NOT NULL CHECK(image_type IN ('front', 'back', 'side', 'neck', 'other')),
      image_data BLOB NOT NULL,
      mime_type TEXT NOT NULL,
      extracted_data TEXT,
      verification_result TEXT,
      confidence_score REAL,
      processed_at DATETIME,
      processing_time_ms INTEGER,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    )
  `);

  // Migration: Update CHECK constraint for image_type to include 'other'
  // SQLite doesn't support ALTER TABLE to modify CHECK constraints, so we need to recreate the table
  try {
    // Check if table exists and if constraint needs updating
    const tableInfo = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='label_images'")
      .get() as { sql: string } | undefined;
    if (tableInfo && !tableInfo.sql.includes("'other'")) {
      // Table exists but doesn't have 'other' in constraint - need to migrate
      db.exec(`
        CREATE TABLE label_images_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          image_type TEXT NOT NULL CHECK(image_type IN ('front', 'back', 'side', 'neck', 'other')),
          image_data BLOB NOT NULL,
          mime_type TEXT NOT NULL,
          extracted_data TEXT,
          verification_result TEXT,
          confidence_score REAL,
          processed_at DATETIME,
          processing_time_ms INTEGER,
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        )
      `);
      db.exec(`INSERT INTO label_images_new SELECT * FROM label_images`);
      db.exec(`DROP TABLE label_images`);
      db.exec(`ALTER TABLE label_images_new RENAME TO label_images`);
    }
  } catch (error) {
    // Migration failed - table might not exist yet or already migrated
    // That's okay, the CREATE TABLE IF NOT EXISTS above will handle it
  }

  // Create audit_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      application_id INTEGER,
      action TEXT NOT NULL CHECK(action IN ('login', 'logout', 'viewed', 'verified', 'approved', 'rejected', 'status_changed', 'created')),
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      details TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE SET NULL
    )
  `);

  // Create indexes for better query performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
    CREATE INDEX IF NOT EXISTS idx_applications_assigned_agent ON applications(assigned_agent_id);
    CREATE INDEX IF NOT EXISTS idx_label_images_application ON label_images(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_application ON audit_logs(application_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  `);
}

// Run migrations lazily - only when database is first accessed
// This prevents build-time errors when database directory doesn't exist
let migrationsRun = false;

export function ensureMigrations() {
  if (!migrationsRun) {
    try {
      runMigrations();
      migrationsRun = true;
    } catch (error) {
      // During build, database might not be available - that's okay
      // Check if we're in a build context
      const isBuildTime =
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.NODE_ENV === 'production' ||
        !process.env.DATABASE_PATH;

      if (
        isBuildTime &&
        error instanceof Error &&
        error.message.includes('Database not available')
      ) {
        // Silently skip during build - database will be initialized at runtime
        return;
      }
      // In runtime, throw the error
      throw error;
    }
  }
}

// Don't auto-run migrations on import - only run when explicitly called
// This prevents build-time database initialization
