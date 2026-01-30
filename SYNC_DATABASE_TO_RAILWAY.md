# Syncing Local Database to Railway Production

This guide shows you how to copy your local database (with users, applications, etc.) to your Railway production environment.

## Method 1: Using Railway Dashboard (Easiest)

### Step 1: Export Your Local Database

```bash
npm run db:export
# or
npx tsx scripts/export-database.ts
```

This creates `database-backup.db` in your project root.

### Step 2: Upload via Railway Dashboard

1. Go to Railway dashboard → Your project → Your service
2. Go to **Volumes** tab
3. Click on your volume (mounted at `/app/data`)
4. Use the file browser to upload `database-backup.db`
5. Rename it to `database.db` in the `/app/data` directory
6. Restart your Railway service

---

## Method 2: Include Database in Git (Quick but Not Recommended for Production)

⚠️ **Warning**: This adds the database to git, which is not ideal for production. Use only for initial setup.

### Step 1: Export Database

```bash
npm run db:export
```

### Step 2: Copy to Data Directory

```bash
cp database-backup.db data/database.db
```

### Step 3: Commit and Push

```bash
git add data/database.db
git commit -m "Add initial database"
git push
```

Railway will deploy with your database included. **Then immediately remove it from git:**

```bash
git rm --cached data/database.db
echo "data/database.db" >> .gitignore
git commit -m "Remove database from git"
```

---

## Method 3: Using Railway Shell (Most Reliable)

### Step 3: Verify

```bash
railway shell
# Inside Railway shell:
npx tsx scripts/create-test-user.ts
# Should say "User already exists" if your local users are there
```

---

### Step 1: Export Database Locally

```bash
npm run db:export
```

### Step 2: Copy Database File to Project Root

Make sure `database-backup.db` is in your project root (same level as `package.json`).

### Step 3: Commit and Push (Temporarily)

```bash
git add database-backup.db
git commit -m "Add database backup for Railway import"
git push
```

### Step 4: Import on Railway

```bash
railway shell
# Inside Railway shell:
npx tsx scripts/import-database-railway.ts
```

### Step 5: Clean Up

Remove the database file from git:

```bash
git rm database-backup.db
echo "database-backup.db" >> .gitignore
git commit -m "Remove database backup from git"
git push
```

---

## Method 3: Using Railway's File System (Advanced)

If you have SSH access or can use Railway's file system:

1. Export database locally: `npx tsx scripts/export-database.ts`
2. Use Railway's volume management to upload the file
3. Or use a temporary file storage service and download it on Railway

---

## Quick Method: Copy Database File to Repo Temporarily

The fastest way is to temporarily include the database in your repo:

```bash
# 1. Export database
npm run db:export

# 2. Copy to data directory
cp database-backup.db data/database.db

# 3. Commit and push (Railway will deploy it)
git add data/database.db
git commit -m "Add initial database"
git push

# 4. Wait for Railway to deploy

# 5. Remove from git (important!)
git rm --cached data/database.db
echo "data/database.db" >> .gitignore
git commit -m "Remove database from git"
git push
```

⚠️ **Important**: Make sure to remove the database from git after deployment, as it contains sensitive data!

---

## Important Notes

⚠️ **Backup First**: Always backup your production database before overwriting it!

⚠️ **File Permissions**: Make sure the database file has correct permissions (read/write) on Railway

⚠️ **Volume Mount**: Ensure your Railway service has a volume mounted at `/app/data`

⚠️ **Database Lock**: Make sure your app is not running or the database is not locked when copying

---

## Troubleshooting

### "Database is locked" error
- Stop your Railway service temporarily
- Upload the database
- Restart the service

### "Permission denied" error
- Check volume mount path
- Verify file permissions
- Ensure volume is properly mounted

### Database not updating
- Clear Railway cache/restart service
- Verify DATABASE_PATH environment variable
- Check volume mount is correct

---

## Alternative: Sync Specific Data

If you only want to sync users (not all data), you can:

1. Export users from local database
2. Run the create-users script on Railway with the same data
3. This avoids overwriting the entire database
