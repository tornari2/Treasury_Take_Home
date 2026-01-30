// Script to export database for Railway deployment
import fs from "fs";
import path from "path";

const localDbPath = "./data/database.db";
const exportPath = "./database-backup.db";

try {
  // Check if local database exists
  if (!fs.existsSync(localDbPath)) {
    console.error(`Error: Local database not found at ${localDbPath}`);
    console.log(
      "Make sure you have run the app locally first to create the database.",
    );
    process.exit(1);
  }

  // Copy database file
  fs.copyFileSync(localDbPath, exportPath);
  console.log(`✅ Database exported to ${exportPath}`);
  console.log(
    `📦 File size: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`,
  );
  console.log("\nNext steps:");
  console.log("1. Upload this file to Railway using: railway volume upload");
  console.log("2. Or use Railway CLI to copy it to /app/data/database.db");
} catch (error) {
  console.error("Error exporting database:", error);
  process.exit(1);
}
