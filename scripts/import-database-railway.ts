// Script to import database on Railway
// This should be run ON Railway (via railway shell or railway run)
import fs from "fs";
import path from "path";

const sourcePath = process.env.DB_BACKUP_PATH || "./database-backup.db";
const targetPath = process.env.DATABASE_PATH || "/app/data/database.db";

try {
  // Check if source file exists
  if (!fs.existsSync(sourcePath)) {
    console.error(`Error: Backup file not found at ${sourcePath}`);
    console.log(
      "Make sure database-backup.db is in the project root or set DB_BACKUP_PATH",
    );
    process.exit(1);
  }

  // Ensure target directory exists
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Copy database file
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✅ Database imported to ${targetPath}`);
  console.log(
    `📦 File size: ${(fs.statSync(targetPath).size / 1024).toFixed(2)} KB`,
  );
  console.log("\nDatabase is now ready for use!");
} catch (error) {
  console.error("Error importing database:", error);
  process.exit(1);
}
